# Evilginx 3.5.5 Private Dev Edition — Linux Deployment Guide

> **⚠️ Authorized Use Only**: This guide is for authorized penetration testing and red team engagements. Do not use this tool without written permission.

## Overview

This guide covers Linux deployment for Evilginx on Ubuntu/Debian systems, including the automated installer, manual build, and optional Cloudflare tunnel or workers.

## Supported Platforms

- Ubuntu 20.04 / 22.04 / 24.04
- Debian 11 / 12
- AMD64 and ARM64

## Recommended Deployment

### Automated Linux Installer

```bash
cd ~/Evilginxmod3
chmod +x install.sh
sudo ./install.sh
```

#### Installer modes

```bash
sudo ./install.sh                # Full installation (recommended)
sudo ./install.sh --upgrade      # Rebuild and reinstall only
sudo ./install.sh --uninstall    # Remove Evilginx binary, service, scripts, and config
sudo ./install.sh --tunnel       # Install Cloudflare Tunnel only
sudo ./install.sh --dry-run      # Show steps without making changes
```

#### Web admin password behavior

- The installer prompts for a web admin password.
- If you skip password entry, the installer generates a strong random password.
- The generated password is saved to `/etc/evilginx/evilginx.env`.
- Evilginx loads `EVILGINX_ADMIN_PASSWORD` from that file on startup.

#### Post-install commands

```bash
evilginx-start
evilginx-stop
evilginx-restart
evilginx-status
evilginx-logs
evilginx-console
```

## Manual Build

```bash
sudo apt update && sudo apt install -y build-essential libsqlite3-dev wget curl
wget https://go.dev/dl/go1.25.7.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.7.linux-amd64.tar.gz
export PATH="$PATH:/usr/local/go/bin"

cd ~/Evilginxmod3
CGO_ENABLED=1 go build -mod=vendor -o build/evilginx main.go
sudo cp build/evilginx /usr/local/bin/evilginx
sudo chmod +x /usr/local/bin/evilginx
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/evilginx
```

## Docker (Experimental)

```bash
docker build -t evilginxmod3 .
docker run -it \
  -p 443:443 -p 80:80 -p 53:53/udp \
  -p 2030:2030 -p 3333:3333 \
  -v $(pwd)/phishlets:/root/phishlets \
  -v $(pwd)/landing_pages:/root/landing_pages \
  -v ~/.evilginx:/root/.evilginx \
  evilginxmod3
```

## Cloudflare Tunnel

```bash
TUNNEL_DOMAIN=example.com sudo ./install.sh --tunnel
```

## Quick Linux Commands

```bash
sudo ./install.sh
evilginx-start
config ipv4 external YOUR_PUBLIC_IP
domains set phishing.example.com
```
