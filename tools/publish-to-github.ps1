$ErrorActionPreference = "Stop"

$RepoName = "official-website"
$HostName = "82.156.97.56"
$DeployUser = "deploy"
$KeyPath = Join-Path $env:USERPROFILE ".ssh\lighthouse_github_actions"
$Git = "C:\Program Files\Git\cmd\git.exe"
$Gh = "C:\Program Files\GitHub CLI\gh.exe"

if (!(Test-Path $Git)) {
  throw "Git was not found at $Git"
}

if (!(Test-Path $Gh)) {
  throw "GitHub CLI was not found at $Gh"
}

if (!(Test-Path $KeyPath)) {
  throw "Deploy private key was not found at $KeyPath"
}

& $Gh auth status

$remote = & $Git remote get-url origin 2>$null
if (!$remote) {
  & $Gh repo create $RepoName --private --source . --remote origin --push
} else {
  & $Git push -u origin main
}

"$HostName" | & $Gh secret set LIGHTHOUSE_HOST
"$DeployUser" | & $Gh secret set LIGHTHOUSE_USER
Get-Content $KeyPath -Raw | & $Gh secret set LIGHTHOUSE_SSH_KEY

& $Gh workflow run "Deploy website"

Write-Host "GitHub repository and deployment secrets are ready."
