# Deployment

## Frontend

Deploy `frontend` on Vercel. Set:

```
API_INTERNAL_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://www.example.com
```

The browser calls `/backend-api`, which the Next.js rewrite forwards to `API_INTERNAL_URL`.

## API

Deploy `backend` on Render or Railway.

```
NODE_ENV=production
PORT=5000
ADMIN_JWT_SECRET=...
ADMIN_BOOTSTRAP_EMAIL=...
ADMIN_BOOTSTRAP_PASSWORD=...
CORS_ORIGIN=https://www.example.com
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Build with `npm run build` and start with `npm start`. Production refuses to boot without `ADMIN_JWT_SECRET`.

Free instances may sleep. The first request after sleep creates the local store if it is not already on disk. Use a persistent disk if the host filesystem is ephemeral, or move the repository to Supabase after applying `database/migrations/001_initial.sql`.

## Database

The SQL migration enables row-level security. Do not put the service-role key in a `NEXT_PUBLIC_` variable.
