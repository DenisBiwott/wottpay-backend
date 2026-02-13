# WottPay Deployment Architecture Guide

## 1. Architecture Overview

The WottPay system uses a **Reverse Proxy architecture** to ensure security, SSL termination, and seamless routing between services.

- **Public Gateway (Nginx)**
  - Single entry point for all external traffic.
  - Handles HTTPS via **Cloudflare Origin Certificates**.
  - Routes traffic to the appropriate container based on domain/subdomain.

- **Frontend (Vue.js)**
  - Served via a lightweight Nginx container.
  - Accessible only through the internal Docker network, not exposed to the public.

- **Backend (NestJS)**
  - Node 20 application providing API endpoints.
  - Accessible only via the internal Docker network (`wottpay-network`).

- **Network**
  - Private bridge network (`wottpay-network`) connects all containers.
  - Only the gateway exposes ports 80 and 443 publicly; frontend and backend remain isolated.

**Benefits:**

- Improved security by exposing only the gateway.
- SSL termination handled at the gateway.
- Simplified container scaling and isolation.

---

## 2. File Structure (Ubuntu Server)

All project files are located under `~/wottpay/`:

```
~/wottpay/
├── wottpay-frontend/      # Vue.js Repository
├── wottpay-backend/       # NestJS Repository
├── certs/                 # Cloudflare Origin Certificates
│   ├── origin.pem         # Public Certificate
│   └── privkey.key        # Private Key
├── portfolio/             # Static HTML for root domain
│   └── index.html
├── nginx.conf             # Global Nginx Configuration (Gateway)
└── compose.yaml           # Docker Compose Orchestration File
```

> **Tip:** Keep certificates and `.env` files outside the Git repository to avoid accidental leaks.

---

## 3. Core Configurations

### 3.1 Gateway Configuration (`nginx.conf`)

Manages multiple domains and environments:

- **denisbiwott.com**
  - Serves a static “Coming Soon” portfolio directly from the server disk.

- **pay.denisbiwott.com**
  - Proxies Vue.js frontend requests to the frontend container.
  - Proxies `/api/` requests to the NestJS backend container.

**Production nginx.conf**

```nginx
# 1. ROOT DOMAIN: Portfolio / Coming Soon
server {
    listen 443 ssl;
    server_name denisbiwott.com www.denisbiwott.com;

    ssl_certificate     /etc/nginx/certs/origin.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.key;

    location / {
        root /usr/share/nginx/portfolio;
        index index.html;
    }
}

# 2. SUBDOMAIN: Wottpay Project
server {
    listen 443 ssl;
    server_name pay.denisbiwott.com;

    resolver 127.0.0.11 valid=30s;

    ssl_certificate     /etc/nginx/certs/origin.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.key;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Support for Vue Router History Mode
        # If the file isn't found on the frontend, tell the frontend to serve index.html
        # This handles the 404s for Vue Router internally
        proxy_intercept_errors on;
        error_page 404 = @fallback;
    }

    location @fallback {
        proxy_pass http://frontend:80;
    }

    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# 3. HTTP to HTTPS Global Redirect
server {
    listen 80;
    server_name denisbiwott.com www.denisbiwott.com pay.denisbiwott.com;
    return 301 https://$host$request_uri;
}
```

- The trailing slash in `proxy_pass` ensures `/api` is stripped before hitting backend routes.

---

### 3.2 Docker Orchestration (`compose.yaml`)

- **Volumes:**
  - Maps `nginx.conf`, `certs/`, and `portfolio/` from host to gateway container using bind mounts.

- **Security:**
  - Only the gateway exposes ports 80 and 443.
  - Frontend and backend containers communicate over `wottpay-network`.

- **Prod Compose.yaml:**

```yaml
services:
  gateway:
    image: nginx:stable-alpine
    container_name: wottpay-gateway
    ports:
      - '80:80'
      - '443:443'
    volumes:
      # Map the nginx.conf from server's current directory into the container
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro

      # Map the certs folder containing your Cloudflare keys
      - ./certs:/etc/nginx/certs:ro

      # Map portfolio site folder to container (Temporarily serving static HTML)
      - ./portfolio:/usr/share/nginx/portfolio:ro
    depends_on:
      - frontend
      - backend
    networks:
      - wottpay-network

  frontend:
    build: ./wottpay-frontend
    networks:
      - wottpay-network
    restart: always

  backend:
    build: ./wottpay-backend
    env_file: ./wottpay-backend/.env
    networks:
      - wottpay-network
    restart: always

# The custom network for inter-service communication (Isolation, Only services in this network can communicate with each other)
networks:
  wottpay-network:
    driver: bridge
```

---

## 4. Deployment Workflow

### 4.1 CI/CD (GitHub Actions)

Automated deployments triggered on `main` branch:

1. GitHub connects via SSH to the DigitalOcean Droplet.
2. Pulls the latest code for **frontend** and **backend** repositories.
3. Rebuilds only modified services:

```bash
docker compose up -d --build --remove-orphans
```

4. Cleans up old Docker images:

```bash
docker image prune -f
```

> **Note:** `SSH_PRIVATE_KEY` and `DROPLET_IP` secret variables must be setup in both Github repos:

### 4.2 Manual Configuration Reload

- If you update `nginx.conf` or SSL certificates, reload Nginx without downtime:

```bash
docker compose exec gateway nginx -s reload
```

> **Tip:** Always test Nginx config syntax before reloading:

```bash
docker compose exec gateway nginx -t
```

---

## 5. Security Checklist

- **Cloudflare:** Use **Full (Strict)** mode to validate origin certificates.
- **Firewall:** Stop host-level Nginx/Apache to free port 80:

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

- **Docker Users:** Run containers as non-root users where possible (`node` user for frontend/backend).
- **Environment Variables:** Keep backend secrets in `.env` files on the server; never commit to Git.

---

## 6. Troubleshooting Commands

| Task                   | Command                                 |
| ---------------------- | --------------------------------------- |
| View logs              | `docker compose logs -f [service_name]` |
| Check container status | `docker compose ps`                     |
| Test Nginx syntax      | `docker compose exec gateway nginx -t`  |
| Check port 80 usage    | `sudo lsof -i :80`                      |

---
