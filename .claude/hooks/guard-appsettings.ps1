# Guard: Block editing appsettings.json directly
$raw  = [Console]::In.ReadToEnd()
$data = $raw | ConvertFrom-Json
$file = $data.tool_input.file_path

if ($file -match 'appsettings\.json$') {
    @{
        continue   = $false
        stopReason = "Blocked: appsettings.json is protected. It contains DB connection strings — edit it manually if needed."
    } | ConvertTo-Json
    exit 1
}
