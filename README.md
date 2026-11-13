# World Area Code Directory

A worldwide telephone numbering directory. Country calling codes, regions, cities and area codes are stored as separate records. A city page stays blank when no area code is on file.

## What is included

- Next.js site with search, country pages, region and city pages, area-code search, phone lookup and country comparison.
- Express API with validation, role checks, audit logs and phone parsing through `libphonenumber-js`.
- 250 countries from the [mledoze/countries](https://github.com/mledoze/countries) reference dataset.
- A curated set of geographic codes with sources. Those records are published as unverified until a reviewer marks them checked.
- PostgreSQL migration and row-level security for Supabase.
- Local JSON store so the app runs before a Supabase project exists.

## Run it locally

```bash
npm install --prefix backend
npm install --prefix frontend
npm run dev --prefix backend
npm run dev --prefix frontend
```

The site is at http://localhost:3000 and the API at http://localhost:5000.

On first boot the API creates a local super admin:

- Email: `admin@worldareacodes.local`
- Password: `DirectoryAdmin!2026`

Change `ADMIN_BOOTSTRAP_PASSWORD` and set `ADMIN_JWT_SECRET` before anyone else can reach the machine. The development signing secret is not for production.

## Data rules

- Do not invent a city area code.
- A code can belong to more than one city. Islamabad and Rawalpindi share 51.
- The same digits can exist in more than one country. Those records stay separate.
- Phone validation does not show whether a number is assigned or who owns it.
- Searches that look like a full phone number are stored as a hash, not as the number.

To rebuild the seed after editing `database/seeds/build-seed.mjs`:

```bash
node database/seeds/build-seed.mjs
```

Delete `database/data/store.json` and restart the API to load the new seed. That file holds local edits and is not committed.

## Tests

```bash
npm test --prefix backend
```

## Production notes

Apply `database/migrations/001_initial.sql` in Supabase before using the database. The API currently serves the local store and reports `dataProvider: "local-json"`. Keep `SUPABASE_SERVICE_ROLE_KEY` on the server only. See `docs/DEPLOYMENT.md` and `docs/SECURITY.md`.
