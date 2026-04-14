import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { spawn } from "child_process";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: userData, error: userErr } =
    await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData.user)
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { id } = await params;

  // ── Fetch dispatch ────────────────────────────────────────────────────────
  const { data: dispatch, error } = await supabaseAdmin
    .from("dispatches")
    .select(
      `
      *,
      dispatch_assignments ( id, profile_id, assignment_type, profiles ( full_name, role ) ),
      dispatch_instruments ( * ),
      dispatch_itinerary ( * ),
      dispatch_machines ( * )
    `
    )
    .eq("id", id)
    .single();

  if (error || !dispatch)
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });

  // ── Generate PDF via Python script ────────────────────────────────────────
  const scriptPath = path.join(process.cwd(), "scripts", "generate_dispatch_pdf.py");

  const pdfBytes = await new Promise<Uint8Array>((resolve, reject) => {
    const child = spawn("python3", [scriptPath]);
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => errChunks.push(chunk));

    child.on("close", (code) => {
      if (code !== 0) {
        const stderrStr = Buffer.concat(errChunks).toString();
        console.error("PDF generation error:", stderrStr);
        reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve(new Uint8Array(Buffer.concat(chunks)));
      }
    });

    child.on("error", reject);
    child.stdin.write(JSON.stringify(dispatch));
    child.stdin.end();
  });

  // ── Return PDF ────────────────────────────────────────────────────────────
  const filename = `dispatch-${dispatch.dispatch_number ?? id}.pdf`;

  return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBytes.length),
    },
  });
}
