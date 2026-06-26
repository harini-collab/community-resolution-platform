# Community Resolution Platform

A civic technology platform for Indian municipalities — problems **reported, tracked, verified, and resolved**.

## Quick Start (Docker — recommended)

```bash
cd project
cp .env.example .env
# Edit .env — set JWT_SECRET to any long random string

# Fresh install with demo data (clears old database):
docker compose down -v
docker compose up --build -d
```

Open **http://localhost:5173**

- API health: **http://localhost:5000/health**
- Track issues (public): **http://localhost:5173/track**
- Admin login: **http://localhost:5173/admin-access**

### Manual setup (without Docker)

Requirements: Node 20+, PostgreSQL 16+

```bash
cd project
npm install
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed.sql
npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:5000

---

## Demo Accounts

**Password for every account below:** `password123`

### Administrator (single account)

| Name | Email | Login page |
|------|-------|------------|
| Priya Sharma | admin.communityresolution@gmail.com | `/admin-access` only |

### Citizens (Gmail)

| Name | Email | City / area |
|------|-------|-------------|
| Priya Menon | priya.menon.citizen@gmail.com | Bangalore |
| Rohit Gupta | rohit.gupta.citizen@gmail.com | Mumbai |
| Ananya Das | ananya.das.citizen@gmail.com | Delhi |
| Mohan Raj | mohan.raj.citizen@gmail.com | Chennai |
| Kavitha Nair | kavitha.nair.citizen@gmail.com | Hyderabad |
| Sana Ahmed | sana.ahmed.citizen@gmail.com | Kolkata |
| Ajay Patil | ajay.patil.citizen@gmail.com | Pune |
| Hema Patel | hema.patel.citizen@gmail.com | Ahmedabad |
| Vikram Singh | vikram.singh.citizen@gmail.com | Jaipur |
| Ritesh Kumar | ritesh.kumar.citizen@gmail.com | Patna (801106) |
| Deepa Sen | deepa.sen.citizen@gmail.com | Lucknow |
| Meera Thomas | meera.thomas.citizen@gmail.com | Kochi |

### Officers (Gmail)

| Name | Email | Department | Coverage |
|------|-------|------------|----------|
| Rajesh Kumar | rajesh.kumar.officer@gmail.com | Roads | Bangalore 560034 |
| Suresh Patel | suresh.patel.officer@gmail.com | Sanitation | Mumbai 400001 |
| Amit Verma | amit.verma.officer@gmail.com | Electrical | Delhi 110001 |
| Lakshmi Iyer | lakshmi.iyer.officer@gmail.com | Sanitation | Chennai 600001 |
| Karthik Reddy | karthik.reddy.officer@gmail.com | Roads | Hyderabad 500081 |
| Debabrata Banerjee | debojyoti.banerjee.officer@gmail.com | Sanitation | Kolkata 700001 |
| Neha Deshmukh | neha.deshmukh.officer@gmail.com | Street Lighting | Pune 411001 |
| Vikas Shah | vikas.shah.officer@gmail.com | Roads | Ahmedabad 380001 |
| Poonam Meena | poonam.meena.officer@gmail.com | Sanitation | Jaipur 302001 |
| Arun Singh | arun.singh.officer@gmail.com | Roads | Patna **801106** |
| Ravi Tiwari | ravi.tiwari.officer@gmail.com | Sanitation | Lucknow 226001 |
| Jose Mathew | jose.mathew.officer@gmail.com | Electrical | Kochi 682001 |

Sign in at **/login** (citizens & officers). Admin uses **/admin-access**.

---

## What's in the demo database

- **19 realistic civic issues** across Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, Jaipur, Patna, Lucknow, and Kochi
- Real photographs (Unsplash) for potholes, garbage, street lights, drainage, etc.
- Issues in various workflow stages: Reported → Assigned → In Progress → Resolved → Verified
- **12 officers** with pincode/ward jurisdiction across India
- Search pincode **801106** on `/track` to see Patna issues immediately

---

## Key Features

- **Track issues** (`/track`) — public search by pincode, ward, keyword (no login)
- **India-first location**: address, area, ward, pincode, landmark
- **Workflow**: Reported → Assigned → Accepted → In Progress → Resolved → Citizen Verified → Closed
- **Photo upload** with auto category suggestion (confirm before submit)
- **Officer tagging** and in-app notifications
- **Community votes & issue following**
- **Live map** with real report data
- **Admin dashboard** for assignment and user management

---

## Environment Variables

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_SECRET` | Required — JWT signing key |
| `CLIENT_ORIGIN` | Frontend URL for CORS |
| `VITE_API_URL` | Browser API base (default `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Socket.io URL |

---

## Project Structure

```text
project/
├── backend/          Express API + Socket.io
├── frontend/         React + Vite + Tailwind
├── database/         schema.sql, seed.sql
├── docker-compose.yml
├── README.md
└── DEPLOY.md
```

---

## Git / Upload checklist

1. Copy `.env.example` → `.env` and set `JWT_SECRET`
2. Run `docker compose down -v && docker compose up --build -d`
3. Verify login with `ritesh.kumar.citizen@gmail.com` / `password123`
4. Verify `/track?pincode=801106` shows Patna issues
5. Change all passwords before any public deployment

---

## Security (before going live)

1. Replace all demo passwords
2. Use a strong random `JWT_SECRET`
3. Enable HTTPS
4. Keep admin route (`/admin-access`) restricted to trusted staff
