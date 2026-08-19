# Guard: Block destructive/mutating SQL commands in psql
$raw  = [Console]::In.ReadToEnd()
$data = $raw | ConvertFrom-Json
$cmd  = $data.tool_input.command

# Only check psql calls -- Hiram is PostgreSQL, migrations run via npm run migrate
if ($cmd -notmatch 'psql') { exit 0 }

# Block these dangerous SQL keywords
$blocked = @(
    'DROP TABLE',
    'DROP DATABASE',
    'DROP SCHEMA',
    'DROP TYPE',
    'TRUNCATE',
    'INSERT INTO',
    'UPDATE ',
    'DELETE FROM',
    'ALTER TABLE'
)

foreach ($keyword in $blocked) {
    if ($cmd -match [regex]::Escape($keyword)) {
        @{
            continue   = $false
            stopReason = "Blocked: '$keyword' detected in a psql command. Claude cannot run schema-altering or data-mutating SQL. Add it as a numbered migration in backend/migrations/ and run 'npm run migrate', or execute it manually if intentional."
        } | ConvertTo-Json
        exit 1
    }
}
