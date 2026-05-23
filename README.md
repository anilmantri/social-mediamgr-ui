# social-mediamgr-ui

React + Vite frontend for the Social Media Manager platform.  
**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query · Recharts

---

## Run locally

**Requirements:** Node.js 18+

### Step 1
```bash
cd social-mediamgr-ui
```

### Step 2
```bash
npm install
```

### Step 3
```bash
copy .env.example .env        # Windows
cp .env.example .env          # Mac/Linux
```

Default `.env` points to `http://localhost:8000` — no changes needed.

### Step 4
```bash
npm run dev
```

Open **http://localhost:3000**

> Make sure `social-mediamgr-service` is running first: `python main.py`

---

## Pages

| Route | Page |
|---|---|
| `/` | Overview dashboard |
| `/content` | Content Studio — generate, approve, reject |
| `/content/:id` | Draft detail — edit, schedule, version history |
| `/calendar` | Monthly calendar — schedule posts |
| `/analytics` | Analytics — engagement charts, best times |
| `/settings` | Instagram connect, brand voice |
