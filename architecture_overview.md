# Calendar Dispatch: Architecture & Workflow Overview

This document serves as an in-depth guide to the architecture, database schema, and core operational workflows of the AMTEC Calendar Dispatch project.

## 1. Technology Stack

*   **Frontend & API Framework:** [Next.js (App Router paradigm)](https://nextjs.org/) using React 18+.
*   **Language:** TypeScript (Strict typing for robust component bindings and API responses).
*   **Styling:** Tailwind CSS (Utility-first CSS framework).
*   **Database & Authentication:** [Supabase](https://supabase.com/) (PostgreSQL + GoTrue Auth).
*   **Components/UI:** Custom-built React components, utilizing standard HTML elements (no UI component library overhead).
*   **Calendar Tooling:** custom-built grid logic mapped to dates.

---

## 2. Directory Structure

The project follows the standard Next.js App Router structure:

```text
calendar-dispatch/
├── app/                      # Next.js App Router Root
│   ├── admin/                # Admin Panel (Role/Staff management)
│   ├── api/                  # Backend API Routes (Next.js Route Handlers)
│   ├── calendar/             # Main global Calendar View
│   ├── components/           # Reusable UI components (Sidebar, TopNav, AppLayout, modal, etc)
│   ├── dashboard/            # User Dashboard view
│   ├── dispatch/             # 'Create New Dispatch' form
│   ├── dispatches/           # Read/Edit views for specific Dispatches (Details & Edit pages)
│   ├── workload-view/        # Specialized Calendar View for Staff Workloads
│   ├── login/                # Authentication page
│   ├── signup/               # Registration page
│   ├── layout.tsx            # Global Root Layout
│   ├── globals.css           # Global Tailwind and base styles
│   └── page.tsx              # Landing Page (redirects based on auth state)
├── lib/                      # Helper libraries
│   └── supabase/             # Supabase client (Browser client + Admin Service Role client)
├── scripts/                  # Development & Database initialization scripts
│   ├── 001_phase1_schema.sql # Initial Supabase Schema
│   ├── 002_staff_and_enhancements.sql # Staff table updates & enhancements
│   ├── 003_machine_instrument_seeds.sql # Machine/Instrument default mappings
│   ├── 004_companies_seed.sql   # Company seed file
│   └── generate_dispatch_pdf.py # Python script for PDF generation (optional external tooling)
└── middleware.ts             # Next.js middleware for route protection based on auth state
```

---

## 3. Database Schema (Supabase / PostgreSQL)

The application relies on a relational data model managed in Supabase.

### Core Tables:

1.  **`profiles`**: Tied 1-to-1 with Supabase Auth (`auth.users`). Contains the user's `role` (`admin_scheduler`, `mechanical_lab`, `staff`, or `pending_verification`) and name.
2.  **`staff`**: Master list of AMTEC personnel (Engineers and Technicians). Includes `full_name`, `initials`, `designation`.
3.  **`companies`**: Master directory of clients/manufacturers, populated heavily via seed data.
4.  **`instruments`**: Catalog of available test instruments (`instrument_name`).
5.  **`machine_instrument_defaults`**: A crucial lookup table mapping a specific `machine_name` to the multiple `instrument_name`s required to test it.

### Transactional Tables:

1.  **`dispatches`**: The core entity representing a scheduled dispatch.
    *   Fields: `dispatch_number` (e.g., DIS-2026-0001), `date_from`, `date_to`, `company_name`, `testing_location`, `status` (Upcoming, Ongoing, Done, Cancelled).
2.  **`dispatch_assignments`**: Maps `dispatches` to `staff` members (Many-to-Many).
    *   Fields: `dispatch_id`, `staff_id`, `assignment_type` (`engineer` or `technician`).
3.  **`dispatch_instruments`**: Maps `dispatches` to required instruments.
    *   Fields: `dispatch_id`, `instrument_name`, `code_brand_model` (The specific ID of the physical instrument unit taken).
4.  **`dispatch_machines`**: Maps `dispatches` to the machines being tested.
    *   Fields: `dispatch_id`, `machine`, `model`, `serial_no`, etc.
5.  **`dispatch_itinerary`**: Sequential daily plan for the dispatch duration.

---

## 4. Core Workflows & Logic

### A. Authentication and Role-Based Access Control (RBAC)

1.  **Login Flow**: User signs in via email/password 👉 Supabase Auth validates credentials 👉 Middleware ([middleware.ts](file:///c:/Intern%20Mark/calendar-dispatch/middleware.ts)) checks the session cookie.
2.  **Role Verification**: If authenticated, layout or page checks the `profiles.role`.
    *   `admin_scheduler` & `mechanical_lab`: Have elevated rights. Can access Admin panel, create dispatches, see full calendars. Navigation links update accordingly (e.g., they see "Calendar" instead of "My Calendar").
    *   `staff`: Standard users. Can view "My Calendar" (their own assigned dispatches) and "Public Calendar" (read-only view of all).
    *   `pending_verification`: New signups must be approved by an Admin before gaining access.

### B. Dispatch Creation & Editing Flow

This is the most complex logical component in the project.

1.  **Data Fetching**: The [app/dispatch/new/page.tsx](file:///c:/Intern%20Mark/calendar-dispatch/app/dispatch/new/page.tsx) fetches dropdown lookup data (Staff, Companies, Instruments, Machines) from respective `/api/` endpoints.
2.  **Company Selection**: Finding a company from the typed searchable dropdown sets the `contact_person` and `contact_number` automatically.
3.  **Machine -> Instrument Auto-population**:
    *   When the user selects a machine (e.g., "Agricultural Trailer"), a `fetch` is made to `/api/machine-instruments`.
    *   This API queries `machine_instrument_defaults` and returns a string array of needed instruments.
    *   The frontend **intercepts** this list and normalizes it (ensuring composite tools like "Graduated Cylinder / Power Meter" are explicitly split into two separate rows).
    *   The frontend assigns a `machine_row_id` to these newly added instruments. If the user changes the machine, the system knows exactly which auto-added instruments to remove before adding the new set, preventing duplicates.
    *   If two *different* machines require the *same* instrument (e.g., a "Caliper"), the system detects the overlap. It adds the first Caliper using the standard ID code, then adds a second Caliper row with a *blank* code field, forcing the user to specify a second, distinct physical unit.
4.  **Conflict Detection (Validation)**:
    *   When the user clicks "Save Dispatch", the frontend captures `date_from`, `date_to`, selected Engineers, Technicians, and specific Instrument Codes (`code_brand_model`).
    *   It POSTs this to `/api/dispatches/check-conflicts`.
    *   The backend queries all existing dispatches that overlap the requested date range and are not "Cancelled" or "Done". It cross-references the assigned staff IDs and instrument codes.
    *   If overlaps exist, the API returns the conflicts. The frontend displays a warning prompt (e.g., "⚠️ Engineer X -> already in DIS-2026-0001"). The user can choose to override or cancel saving.
5.  **Database Commit**:
    *   A massive JSON payload hits `POST /api/dispatches` (or [PUT](file:///c:/Intern%20Mark/calendar-dispatch/app/api/dispatches/%5Bid%5D/route.ts#41-188) for edits).
    *   The backend inserts the core `dispatch` row, retrieves the auto-generated UUID, and heavily leverages parallel `supabaseAdmin.from(...).insert(...)` blocks to save all linked rows in assignments, instruments, machines, and itineraries.

### C. Calendar and Workload Views

1.  **General Calendar (`/calendar` & `/public-calendar`)**:
    *   Fetches all active dispatches.
    *   Calculates block spans bridging across weeks.
    *   Displays colored dispatch blocks on a grid representing days of the month.
2.  **Workload View (`/workload-view`)**:
    *   Fetches dispatches *grouped* by Engineer/Technician.
    *   Renders a Gantt-chart-style timeline layout displaying which staff member is dispatched where, making resource allocation heavily visual to managers.

---

## 5. Security & API Design

*   **Row Level Security (RLS)**: Not primarily utilized in favor of Service-Role backend verification.
*   **Next.js Route Handlers**: All database writes and sensitive reads occur server-side inside the `/api` directory.
    *   `token` validation: Most routes extract the `Authorization: Bearer <token>` from headers.
    *   They call `supabase.auth.getUser(token)` to ensure the requester is authenticated before querying the DB.
*   **Supabase Admin Client**: [lib/supabase/admin.ts](file:///c:/Intern%20Mark/calendar-dispatch/lib/supabase/admin.ts) implements a client utilizing the `SUPABASE_SERVICE_ROLE_KEY`. This bypasses RLS policies entirely, allowing server routes to perform extensive relational inserts safely based purely on backend logic validation.

---

## 6. How to Deploy / Onboard

1. **Environment Setup**: Ensure [.env.local](file:///c:/Intern%20Mark/calendar-dispatch/.env.local) contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Database Migrations**: Run the SQL scripts in chronological order from `scripts/` inside the Supabase SQL interface.
   - Run `001`, `002`, `003`, `004`.
   - Run `005` & `006` to ensure legacy combined instruments ("Graduated Cylinder / Power Meter") are cleanly separated in the target DB instance.
3. **Run Application**: `npm install` followed by `npm run dev` or `npm run build && npm run start`.
