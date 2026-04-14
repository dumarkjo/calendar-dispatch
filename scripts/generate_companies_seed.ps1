# generate_companies_seed.ps1
# Reads MANUFACTURERS LISTS CSV and outputs 004_companies_seed.sql

$csvPath   = "C:\Users\Dell\Downloads\MANUFACTURERS LISTS - Sheet1.csv"
$outputPath = "$PSScriptRoot\004_companies_seed.sql"

$lines = @(
"-- ============================================================"
"-- AMTEC Calendar-Dispatch: Companies / Manufacturers Seed"
"-- Run AFTER 002_staff_and_enhancements.sql"
"-- ============================================================"
""
"INSERT INTO companies (name, contact_person, contact_number) VALUES"
)

# Read raw CSV, skip blank/header rows
$rows = Import-Csv -Path $csvPath -Header "name","contact_person","contact_number" |
        Where-Object { $_.name -ne "" -and $_.name -ne "MANUFACTURER" -and $_.name -notmatch "^,*$" }

$values = @()
foreach ($row in $rows) {
    # Escape single quotes for SQL
    $name    = $row.name.Trim()         -replace "'","''"
    $contact = $row.contact_person.Trim() -replace "'","''"
    $phone   = $row.contact_number.Trim() -replace "'","''"

    if ($name -eq "") { continue }

    $contactSql = if ($contact -ne "") { "'" + $contact + "'" } else { "NULL" }
    $phoneSql   = if ($phone   -ne "") { "'" + $phone   + "'" } else { "NULL" }

    $values += "  ('$name', $contactSql, $phoneSql)"
}

$lines += ($values -join ",`n")
$lines += "ON CONFLICT (name) DO UPDATE SET"
$lines += "  contact_person = EXCLUDED.contact_person,"
$lines += "  contact_number = EXCLUDED.contact_number;"
$lines += ""

Set-Content -Path $outputPath -Value ($lines -join "`n") -Encoding UTF8
Write-Host "Done! Written to: $outputPath"
Write-Host "Total companies: $($values.Count)"
