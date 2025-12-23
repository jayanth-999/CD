# Chocolatey Installation Fix Guide

## Issue
Chocolatey installation was detected but the `choco` command is not recognized.

## Solution Steps

### Option 1: Clean Install Chocolatey (Recommended)

**Step 1: Remove existing Chocolatey remnants**

Open PowerShell as **Administrator** and run:

```powershell
# Remove old Chocolatey directory if it exists
Remove-Item -Path "C:\ProgramData\chocolatey" -Recurse -Force -ErrorAction SilentlyContinue

# Remove from PATH
$oldPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$newPath = ($oldPath.Split(';') | Where-Object { $_ -notlike '*chocolatey*' }) -join ';'
[Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
```

**Step 2: Fresh Install**

```powershell
# Set execution policy
Set-ExecutionPolicy Bypass -Scope Process -Force

# Install Chocolatey
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Step 3: Refresh Environment**

Close PowerShell and open a new PowerShell window as Administrator, then verify:

```powershell
choco --version
```

---

### Option 2: Manual PATH Fix (If Chocolatey is installed)

If Chocolatey is actually installed but just not in PATH:

```powershell
# Add Chocolatey to PATH for current session
$env:PATH += ";C:\ProgramData\chocolatey\bin"

# Add permanently to system PATH
$oldPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$newPath = $oldPath + ";C:\ProgramData\chocolatey\bin"
[Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')

# Restart PowerShell and test
choco --version
```

---

### Option 3: Skip Chocolatey - Install Tools Manually

If Chocolatey continues to have issues, install tools manually:

#### Docker Desktop
1. Download: https://www.docker.com/products/docker-desktop
2. Run installer
3. Restart computer
4. Enable Kubernetes in Docker Desktop settings

#### kubectl
```powershell
# Download kubectl
curl.exe -LO "https://dl.k8s.io/release/v1.28.0/bin/windows/amd64/kubectl.exe"

# Move to Program Files
New-Item -ItemType Directory -Force -Path "C:\Program Files\kubectl"
Move-Item kubectl.exe "C:\Program Files\kubectl\"

# Add to PATH
$oldPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$newPath = $oldPath + ";C:\Program Files\kubectl"
[Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
```

#### Helm
```powershell
# Download Helm
curl.exe -LO "https://get.helm.sh/helm-v3.13.0-windows-amd64.zip"

# Extract and move
Expand-Archive helm-v3.13.0-windows-amd64.zip
Move-Item helm-v3.13.0-windows-amd64\windows-amd64\helm.exe "C:\Program Files\kubectl\"
```

#### k9s (Optional)
Download from: https://github.com/derailed/k9s/releases

---

## Verification Script

After installation, run this to verify everything:

```powershell
Write-Host "=== Verification ===" -ForegroundColor Green

# Docker
Write-Host "`nDocker:" -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker --version
} else {
    Write-Host "Docker not installed" -ForegroundColor Red
}

# kubectl
Write-Host "`nkubectl:" -ForegroundColor Yellow
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    kubectl version --client
} else {
    Write-Host "kubectl not installed" -ForegroundColor Red
}

# Helm
Write-Host "`nHelm:" -ForegroundColor Yellow
if (Get-Command helm -ErrorAction SilentlyContinue) {
    helm version
} else {
    Write-Host "Helm not installed" -ForegroundColor Red
}

Write-Host "`n=== Complete ===" -ForegroundColor Green
```

---

## Next Steps After Fix

1. ✅ Install Docker Desktop (most important)
2. ✅ Enable Kubernetes in Docker Desktop
3. ✅ Install kubectl
4. ✅ Install Helm
5. ✅ Verify installations
6. ✅ Start Week 1 of master-learning-path.md

---

## Need Help?

If you continue to have issues:
1. Ensure PowerShell is running as **Administrator**
2. Check Windows Defender/Antivirus isn't blocking
3. Try Option 3 (manual installation) instead of Chocolatey
4. Docker Desktop is the most critical - focus on getting that working first

Good luck! 🚀
