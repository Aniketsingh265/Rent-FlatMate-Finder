# Rent & Flatmate Finder

A platform where owners list rooms and tenants create "looking for room" profiles. An AI-powered compatibility engine scores and ranks matches, real-time chat unlocks once interest is accepted, and email notifications fire on key events.

## Tech Stack

- **Backend:** Node.js, Express 5, MongoDB (Mongoose), Socket.IO, JWT auth, Nodemailer, Cloudinary + Multer, OpenAI SDK
- **Frontend:** React 19, React Router, Vite, Axios, Socket.IO client, react-hot-toast

## Project Structure

```
Backend/
  controllers/    # request handlers (auth, listing, tenant, interest, chat)
  routes/         # Express routers, mounted in index.js
  models/         # Mongoose schemas
  services/       # email, socket, AI compatibility scoring, cloud upload
  middlewares/    # JWT auth guard + role restriction, file upload
  connection.js   # MongoDB connection helper
  index.js        # app entrypoint (Express + HTTP + Socket.IO server)

Frontend/
  pages/          # route-level components
  components/     # shared UI (Navbar)
  context/auth.jsx # auth state (JWT + current user), synced across tabs
  services/api.js  # Axios client + all API calls
```

## Setup Guide

### Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod` or a free MongoDB Atlas cluster)
- A Gmail account with 2-Step Verification enabled (for sending notification emails)
- A free Cloudinary account (for listing photo uploads)
- An OpenAI API key (for compatibility scoring; app falls back to a rule-based scorer if unavailable)

### Backend

```bash
cd Backend
npm install
cp .env.example .env   # fill in the values (see below)
npm run dev             # nodemon, auto-restarts on changes
# or: npm start
```

Runs on `http://localhost:5000` by default.

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env   # set VITE_API_URL if not using the default
npm run dev
```

Runs on `http://localhost:5173` by default (Vite's default port).

### Environment Variables

See `Backend/.env.example` and `Frontend/.env.example` for the full list. Notable ones:

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | Local MongoDB URL, or your Atlas connection string |
| `JWT_SECRET` | Any long random string |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `EMAIL_USER` / `EMAIL_PASS` | A real Gmail address + an [App Password](https://myaccount.google.com/apppasswords) (requires 2-Step Verification) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary Console → Dashboard / API Keys |
| `CLIENT_URL` | Frontend origin, used for CORS (e.g. `http://localhost:5173`) |
| `VITE_API_URL` (frontend) | Backend API base URL (e.g. `http://localhost:5000/api`) |

## Database Schema

**User** — `name, email (unique), password (bcrypt-hashed), role (tenant \| owner \| admin), phone, avatar, isActive, timestamps`

**Listing** — `owner (→User), title, location, rent, availableFrom, roomType (single \| shared), furnished, photos[] (Cloudinary URLs), description, amenities[], isFilled, gender (male \| female \| any), timestamps`. Text index on `location` + `title`.

**TenantProfile** — `user (→User, unique), preferredLocation, budgetMin, budgetMax, moveInDate, preferences {furnished, roomType, gender}, bio, timestamps`

**Compatibility** — `tenant (→User), listing (→Listing), score (0–100), explanation, scoredBy (llm \| rule-based), timestamps`. Unique index on `(tenant, listing)` — computed once, cached, never recomputed.

**Interest** — `tenant (→User), listing (→Listing), owner (→User), status (pending \| accepted \| declined), compatibilityScore, message, timestamps`. Unique index on `(tenant, listing)`.

**Message** — `interest (→Interest), sender (→User), content, readBy[] (→User), timestamps`

## API Reference

All protected routes require `Authorization: Bearer <token>`.

### Auth (`/api/auth`)
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/register` | — | `{ name, email, password, role }` |
| POST | `/login` | — | `{ email, password }` |
| GET | `/me` | any | — |

### Listings (`/api/listings`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | any | Query: `location, minBudget, maxBudget, furnished, roomType`. Tenants with a saved profile get `compatibilityScore` per listing, sorted descending. |
| GET | `/my` | owner | Owner's own listings |
| GET | `/:id` | any | Single listing |
| POST | `/` | owner | `multipart/form-data`: text fields + up to 5 `photos` files |
| PUT | `/:id` | owner | Update own listing |
| DELETE | `/:id` | owner | Delete own listing |
| PATCH | `/:id/fill` | owner | Marks `isFilled: true`; hides it from tenant search |

### Tenant Profile (`/api/tenants`)
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/profile` | tenant | `{ preferredLocation, budgetMin, budgetMax, moveInDate, preferences, bio }` (upsert) |
| GET | `/profile` | tenant | — |

### Interests (`/api/interests`)
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/` | tenant | `{ listingId, message }`. Emails owner if the (already-computed) compatibility score is ≥ 80. |
| PATCH | `/:id` | owner | `{ status: "accepted" \| "declined" }`. Emails the tenant with the result. |
| GET | `/my` | tenant | Interests the tenant has sent |
| GET | `/received` | owner | Interests received on the owner's listings |

### Chat (`/api/chat`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/:interestId` | tenant or owner on that interest | Only available once `status === "accepted"` |

**Socket.IO events** (auth via `socket.handshake.auth.token`):
- `join_room(interestId)` — client joins the room for that interest
- `send_message({ interestId, content })` — persists the message, then broadcasts
- `receive_message(message)` — server → client, new message in the room
- `mark_read({ interestId })` — marks unread messages as read by the current user

### Admin (`/api/admin`)
| Method | Path | Auth |
|---|---|---|
| GET | `/stats` | admin — counts of users/listings/interests |
| GET | `/users` | admin |
| DELETE | `/users/:id` | admin |
| GET | `/listings` | admin |
| DELETE | `/listings/:id` | admin |

## LLM Compatibility Scoring

Computed once per `(tenant, listing)` pair the first time a tenant with a saved profile browses listings, then cached in the `Compatibility` collection — never recomputed on subsequent requests.

**Model:** `gpt-4o`, `max_tokens: 300`

**Prompt template:**
```
Given this room listing: {location, rent, roomType, furnished, availableFrom}
and this tenant profile: {preferredLocation, budgetMin, budgetMax, moveInDate, preferences},
compute a compatibility score from 0 to 100 based on budget and location match.
Return JSON only: { "score": number, "explanation": string }
```

**Example input:**
```json
{
  "listing": { "location": "Bandra West, Mumbai", "rent": 18000, "roomType": "single", "furnished": true, "availableFrom": "2026-08-01" },
  "tenantProfile": { "preferredLocation": "Bandra, Mumbai", "budgetMin": 15000, "budgetMax": 20000, "moveInDate": "2026-08-15", "preferences": { "furnished": true, "roomType": "single" } }
}
```

**Example output:**
```json
{ "score": 92, "explanation": "Rent is well within budget and the location closely matches the tenant's preferred area. Furnishing and room type also match, making this a strong fit." }
```

**Fallback:** if the OpenAI call fails or throws (rate limit, network error, malformed response), `services/ai.js` falls back to a deterministic rule-based scorer: budget match (40 pts), location substring match (40 pts), furnished preference match (10 pts), room type match (10 pts) — capped at 100, tagged `scoredBy: "rule-based"`.

## Notification Flow

1. **Tenant → Owner:** when a tenant sends interest and a cached compatibility score for that pair already exists and is ≥ 80, the owner receives a "New Interest" email.
2. **Owner → Tenant:** when the owner accepts or declines an interest, the tenant receives a result email (no score threshold — always fires on status change).

Both use Nodemailer over Gmail SMTP (`services/email.js`). Send failures are logged server-side and do not fail the API request.
