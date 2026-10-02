# Techtonix 🌐

A real-time community platform for college students to report, discuss, and track campus issues — powered by AI and interactive maps.

---

## 🚀 Features

- 📝 **Create Posts** — Report campus issues with title, description, category, and location
- 🤖 **AI Analysis** — Google Gemini AI automatically classifies posts, extracts sentiment, urgency, and tags
- 🗺️ **Live Map** — Leaflet + OpenStreetMap displays all posts with real GPS coordinates as interactive markers
- 📍 **Smart Geocoding** — Enter any location in plain text (e.g. "near DBIT Kurla") and the app resolves it to real lat/lng via Nominatim
- 🔐 **Auth** — Supabase-powered sign up, login, and protected routes
- 👍 **Interactions** — Upvote, mark as valid, or report posts
- 🔍 **Filter & Search** — Filter posts by category, search by keyword
- 📊 **Dashboard** — View stats and your own post history

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Styling | Vanilla CSS |
| Map | Leaflet + React Leaflet + OpenStreetMap |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Google Gemini API |
| Geocoding | OpenStreetMap Nominatim |

---

## 📁 Project Structure

```
Techtonix/
├── client/                  # React frontend (Vite, port 5173)
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       ├── context/         # Auth context
│       ├── lib/             # API helpers, Supabase client
│       └── constants/       # Institution config
├── server/                  # Express backend (port 5000)
│   └── src/
│       ├── routes/          # API routes
│       ├── services/        # AI, geocoding, post logic
│       ├── middleware/      # Auth, validation, rate limiting
│       └── schemas/         # Zod validation schemas
└── README.md
```

---

## ⚙️ Setup

### Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/31Aamna/Aivengers.git
cd Aivengers
```

### 2. Backend setup

```bash
cd server
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Frontend setup

```bash
cd client
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

---

## 🔑 Environment Variables

**`server/.env`**

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

**`client/.env`**

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:5000
```

---

## 🗄️ Database Schema

The `posts` table in Supabase includes:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Post title |
| `content` | text | Post body |
| `category` | text | Issue category |
| `location` | text | Human-readable location |
| `latitude` | double precision | GPS latitude |
| `longitude` | double precision | GPS longitude |
| `user_id` | uuid | Author (FK to auth.users) |
| `created_at` | timestamptz | Creation timestamp |

---

## 🌍 How Geocoding Works

1. User types a location (e.g. *"DBIT Kurla"*)
2. Gemini AI normalizes it to a proper, searchable place name
3. OpenStreetMap Nominatim resolves it to real `latitude` / `longitude`
4. Coordinates are saved to Supabase and rendered as a marker on the live map

---

## 🗺️ Map

The interactive map is built with **Leaflet** + **React Leaflet** and uses **OpenStreetMap** tiles (no API key required). Every post with valid coordinates appears as a clickable marker showing the post title and location.

---

## 📜 License

MIT © 2024 Techtonix
