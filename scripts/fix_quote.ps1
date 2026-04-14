$f = 'c:\Intern Mark\calendar-dispatch\scripts\004_companies_seed.sql'
$text = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$old = "('PRINCENA" + "'" + "S MACHINE SHOP'"
$new = "('PRINCENA" + "''" + "S MACHINE SHOP'"
$text = $text.Replace($old, $new)
[System.IO.File]::WriteAllText($f, $text, [System.Text.Encoding]::UTF8)
Write-Host "Done"
