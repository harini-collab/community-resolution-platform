# Production deployment guide

## Docker (fastest live deploy)

```bash
cp .env.example .env
# Set JWT_SECRET to a long random value
docker compose up --build -d
```

App: http://localhost:5173  
API: http://localhost:5000  

## Production checklist

- [ ] Change seed passwords (`admin@example.com`, etc.)
- [ ] Set strong `JWT_SECRET` in `.env`
- [ ] Set `CLIENT_ORIGIN` to your public domain
- [ ] Set `VITE_API_URL` and `VITE_SOCKET_URL` to your public API URL
- [ ] Enable HTTPS (nginx/Caddy reverse proxy)
- [ ] Optional: configure Cloudinary for image storage
- [ ] Run migrations on existing DB:
  - `psql "$DATABASE_URL" -f database/migrations/001_community_resolution.sql`
  - `psql "$DATABASE_URL" -f database/migrations/002_audit_gaps.sql`

## Nginx example

```nginx
server {
  listen 443 ssl;
  server_name civic.example.gov;

  location / {
    root /var/www/community-resolution/frontend/dist;
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:5000;
  }

  location /socket.io/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Demo accounts (change before go-live)

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@example.com | password123 |
| Officer | officer@example.com | password123 |
| Admin | admin@example.com | password123 |

Admin dashboard is at `/admin` — sign in via `/admin-access` (not linked publicly).
