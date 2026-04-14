-- ============================================================
-- AMTEC Calendar-Dispatch: Phase 2 Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── 1. Create staff table (separate from auth profiles) ────────
-- Staff members are selectable on dispatch forms but do NOT need
-- to log in to the system.

CREATE TABLE IF NOT EXISTS staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL,
  surname      TEXT NOT NULL,
  initials     TEXT NOT NULL,
  designation  TEXT,
  email        TEXT,
  role         TEXT NOT NULL CHECK (role IN ('engineer', 'technician')),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. Seed Engineers (16 assignable) ──────────────────────────

INSERT INTO staff (full_name, surname, initials, designation, email, role) VALUES
  ('FATIMA JOY R. AYING',        'AYING',       'FJRA', 'Engineer III',                  'fjraytana@up.edu.ph',      'engineer'),
  ('DEO-JAY T. MANGLAL-LAN',     'MANGLAL-LAN', 'DJTM', 'Junior Project Associate',      'dtmanglallan@up.edu.ph',   'engineer'),
  ('JOHN PAUL A. PALILLO',       'PALILLO',     'JPAP', 'Senior Engineering Assistant',  'japalillo@up.edu.ph',      'engineer'),
  ('FRANKLIN C. PAJARON',        'PAJARON',     'FCP',  'Senior Engineering Assistant',  'fcpajaron@up.edu.ph',      'engineer'),
  ('GLORY YSTER M. REGINIO',     'REGINIO',     'GYMR', 'Junior Project Associate',      'gmreginio@up.edu.ph',      'engineer'),
  ('JEDIDIAH Y. DELA CRUZ',      'DELA CRUZ',   'JYDC', 'Junior Engineering Assistant',  'jydelacruz1@up.edu.ph',    'engineer'),
  ('ANGELITO R. MANUMBALI',      'MANUMBALI',   'ARM',  'Junior Engineering Assistant',  'armanumbali1@up.edu.ph',   'engineer'),
  ('LADY HANNAH R. YAP',         'YAP',         'LHRY', 'Junior Engineering Assistant',  'lryap@up.edu.ph',          'engineer'),
  ('NUR B. DAMANCE',             'DAMANCE',     'NBD',  'Junior Engineering Assistant',  'nbdamance@up.edu.ph',      'engineer'),
  ('ARNIE C. ANINGAT',           'ANINGAT',     'ACA',  'Junior Engineering Assistant',  'acaningat@up.edu.ph',      'engineer'),
  ('MONALIZA G. MONFERO',        'MONFERO',     'MGM',  'Junior Engineering Assistant',  'mgmonfero@up.edu.ph',      'engineer'),
  ('MA. SHAIRA D. KAHARIAN',     'KAHARIAN',    'MSDK', 'Junior Engineering Assistant',  'mdkaharian@up.edu.ph',     'engineer'),
  ('JAN RORILEI C. ALIMA',       'ALIMA',       'JRCA', 'Junior Engineering Assistant',  'jcalima@up.edu.ph',        'engineer'),
  ('PRIMO JR. III T. LORZANO',   'LORZANO',     'PTL',  'Junior Engineering Assistant',  'ptlorzano@up.edu.ph',      'engineer'),
  ('DAVID L. BONDOC',            'BONDOC',      'DLB',  'Junior Engineering Assistant',  'dlbondoc@up.edu.ph',       'engineer'),
  ('PERE DANE B. VILLALOBOS',    'VILLALOBOS',  'PDBV', 'Junior Engineering Assistant',  'pbvillalobos@up.edu.ph',   'engineer')
ON CONFLICT DO NOTHING;

-- ─── 3. Seed Technicians (9 assignable) ─────────────────────────

INSERT INTO staff (full_name, surname, initials, designation, email, role) VALUES
  ('Julious Cesar C. Agan',       'AGAN',        'JCCA', 'Senior Utility Worker', 'jcagan@up.edu.ph',              'technician'),
  ('Peter C. Libarnes, Jr.',      'LIBARNES',    'PCLJ', 'Junior Utility Worker',  'pclibarnes@up.edu.ph',          'technician'),
  ('Jeoffrey S. Beltran',         'BELTRAN',     'JSB',  'Senior Utility Worker', 'jsbeltran1@up.edu.ph',           'technician'),
  ('Primitivo A. Cañales, Jr',    'CAÑALES',     'PACJ', 'Senior Utility Worker', 'pacanales2@up.edu.ph',           'technician'),
  ('Antonio Padua C. Juarez',     'JUAREZ',      'APCJ', 'Admin Aide I',          'acjuarez@up.edu.ph',             'technician'),
  ('Jerome N. Castillo',          'CASTILLO',    'JNC',  'Senior Utility Worker', 'jncastillo1@up.edu.ph',          'technician'),
  ('Joel R. Soriyao',             'SORIYAO',     'JRS',  'Senior Utility Worker', 'jrsoriyao@up.edu.ph',            'technician'),
  ('Kent G. Batobalonos',         'BATOBALONOS', 'KGB',  'Senior Utility Worker', 'kgbatobalonos@up.edu.ph',        'technician'),
  ('Rickie Bhoy M. Golveo',       'GOLVEO',      'RBMG', 'Senior Utility Worker', 'rmgolveo@up.edu.ph',             'technician')
ON CONFLICT DO NOTHING;

-- ─── 4. Add staff_id to dispatch_assignments ────────────────────
-- Allows assignments to reference the staff table (not auth profiles)

ALTER TABLE dispatch_assignments
  ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

-- ─── 5. Create companies table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  contact_number TEXT,
  address        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. Create machine_instrument_defaults table ─────────────────
-- Maps a machine type to its required instrument names for testing.
-- Uses instrument_name TEXT (not a FK) for simpler seeding.
-- Populated by script 003_machine_instrument_seeds.sql

CREATE TABLE IF NOT EXISTS machine_instrument_defaults (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name    TEXT NOT NULL,
  instrument_name TEXT NOT NULL,
  UNIQUE (machine_name, instrument_name)
);

-- ─── Done! ───────────────────────────────────────────────────────
