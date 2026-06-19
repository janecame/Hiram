# Guard: Block destructive/mutating SQL commands in sqlcmd
$raw  = [Console]::In.ReadToEnd()
$data = $raw | ConvertFrom-Json
$cmd  = $data.tool_input.command

# Only check sqlcmd calls
if ($cmd -notmatch 'sqlcmd') { exit 0 }

# Block these dangerous SQL keywords
$blocked = @(
    'DROP TABLE',
    'TRUNCATE TABLE',
    'DROP DATABASE',
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM'
)

foreach ($keyword in $blocked) {
    if ($cmd -match [regex]::Escape($keyword)) {
        @{
            continue   = $false
            stopReason = "Blocked: '$keyword' detected. Claude cannot run data-mutating SQL — execute it manually in SSMS or sqlcmd if intentional."
        } | ConvertTo-Json
        exit 1
    }
}
