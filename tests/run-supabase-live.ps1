param(
  [string]$ProjectRef = $(if ($env:LIVE_SUPABASE_PROJECT_REF) {
    $env:LIVE_SUPABASE_PROJECT_REF
  } else {
    'rmpidzhngmpqpkpryoux'
  })
)

$ErrorActionPreference = 'Stop'
$token = [Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'Process')
if ([string]::IsNullOrWhiteSpace($token)) {
  $token = [Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'User')
}
if ([string]::IsNullOrWhiteSpace($token)) {
  $token = [Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', 'Machine')
}

if ([string]::IsNullOrWhiteSpace($token)) {
  throw 'SUPABASE_ACCESS_TOKEN is unavailable in Windows Process, User, and Machine scopes.'
}

try {
  $env:SUPABASE_ACCESS_TOKEN = $token
  $env:LIVE_SUPABASE_PROJECT_REF = $ProjectRef
  & node "$PSScriptRoot\verify-supabase-live.mjs"
  exit $LASTEXITCODE
} finally {
  Remove-Item Env:SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:LIVE_SUPABASE_PROJECT_REF -ErrorAction SilentlyContinue
  $token = $null
}
