# Evilginx 3.5.5 Private Dev Edition — Windows Deployment Guide

> **⚠️ Authorized Use Only**: This guide is for authorized penetration testing and red team engagements. Do not use this tool without written permission.

## Overview

This guide covers Windows deployment for Evilginx, including the automated installer, password recovery, and the local admin web interface.

## Supported Platforms

- Windows 10 / 11
- Windows Server 2016+
- Administrator privileges required for installation and service creation

## Automated Windows Installer

Run PowerShell as Administrator, then:

```powershell
cd C:\path\to\Evilginxmod3
.\install-windows.ps1
```

The installer will:

- Install Go if missing
- Build Evilginx with `CGO_ENABLED=1`
- Copy the binary, phishlets, redirectors, web files, and docs to `C:\Evilginx`
- Install NSSM and create a Windows service
- Configure Windows Firewall for ports 53, 80, 443, 2030, and 3333
- Create helper commands for service control
- Prompt for a web admin password or generate one automatically

## Web Admin Password and Local Console

- Admin panel URL: `http://127.0.0.1:2030/login`
- Admin username: `admin`
- Password is stored in `C:\Users\<YourUser>\.evilginx\evilginx.env`
- The service passes `EVILGINX_ADMIN_PASSWORD` to the Evilginx process on startup

### If you skipped password entry during install

The installer generates a secure random password and writes it to the file above.
Use that password to log in.

## Recover or Reset Local Admin Password

If you cannot log in to the Windows admin panel, reset the password with:

```powershell
cd C:\Evilginx
.
\evilginx.exe -c $env:USERPROFILE\.evilginx --reset-admin-password "NewPassword123!"
```

Or from anywhere in PowerShell:

```powershell
$env:EVILGINX_ADMIN_PASSWORD = "NewPassword123!"
cd C:\Evilginx
.
\evilginx.exe -c $env:USERPROFILE\.evilginx --reset-admin-password "NewPassword123!"
```

Then restart the service:

```powershell
net stop Evilginx
net start Evilginx
```

## Windows Service Commands

```powershell
evilginx-start
evilginx-stop
evilginx-restart
evilginx-status
evilginx-logs
evilginx-console
```

## Notes

- The admin API listens on `0.0.0.0:2030` by default for the service.
- Use `http://127.0.0.1:2030/login` for local access.
- If the service is running, use `evilginx-logs` to inspect startup errors.
- If the installer created `evilginx.env`, the file should contain:

```text
EVILGINX_ADMIN_PASSWORD="<password>"
```

## Troubleshooting

- Ensure Windows Firewall allows port `2030`.
- If `evilginx.exe` fails to start, confirm `Go` is installed and the binary was built with `CGO_ENABLED=1`.
- If login still fails after reset, stop the service, run the reset command again, then start the service.
