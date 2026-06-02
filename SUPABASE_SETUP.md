# Supabase Setup (one-time)

## 1. Create a Supabase project
Go to https://supabase.com, create a new project.

## 2. Run this SQL in the SQL Editor (Database → SQL Editor)

```sql
create table bobby_location (
  id integer primary key default 1,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  updated_at timestamptz default now()
);

-- Seed the single row Bobby will always upsert
insert into bobby_location (id, latitude, longitude) values (1, 0, 0);

-- Enable real-time updates
alter table bobby_location replica identity full;
```

## 3. Enable Real-Time for the table
Go to **Database → Replication** and toggle `bobby_location` ON.

## 4. Enable Row Level Security
Go to **Authentication → Policies** → select `bobby_location` → Enable RLS.

Add two policies:

**Policy 1 — Allow anyone to read:**
- Name: `Allow public read`
- Operation: `SELECT`
- Target roles: `anon`
- Policy: `true`

**Policy 2 — Allow anyone to update:**
- Name: `Allow public update`
- Operation: `UPDATE`
- Target roles: `anon`
- Policy: `true`

(Password protection is handled in the app — only Bobby knows the password.)

## 5. Copy your API keys
Go to **Settings → API** and copy:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 6. Create .env.local
Copy `.env.local.example` to `.env.local` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BOBBY_PASSWORD=yourpassword
```

## 7. Run the app
```bash
npm run dev
```

## Adding the race route
When you have a GPX file:
1. Export the route from Strava, Garmin, RideWithGPS, etc. as a `.gpx` file
2. Rename it `route.gpx`
3. Drop it in the `public/` folder
4. The fan map will automatically load it on next page load

## Deploying (Vercel)
1. Push to GitHub
2. Import the repo in Vercel
3. Add the three env vars under **Settings → Environment Variables**
4. Deploy — geolocation requires HTTPS, which Vercel provides automatically
