# API

Base path: `/api/v1`

List responses use `{ success, data, meta }`. Phone routes return a flat object and always include a disclaimer when a number is parsed.

## Public

- `GET /health`
- `GET /stats`
- `GET /settings`
- `GET /sources`
- `GET /countries?page&limit&search&continent&letter&sort&order&iso`
- `GET /countries/:slug` also accepts an ISO code or `usa` / `uk`
- `GET /countries/code/:callingCode`
- `GET /countries/iso/:iso2`
- `GET /countries/:slug/regions/:regionSlug`
- `GET /countries/:slug/cities/:citySlug`
- `GET /regions`, `GET /regions/:id`, `GET /regions/:id/cities`, `GET /regions/:id/area-codes`
- `GET /cities`, `GET /cities/:id`, `GET /cities/slug/:slug`, `GET /cities/:id/area-codes`
- `GET /area-codes`, `GET /area-codes/search`, `GET /area-codes/code/:code`, `GET /area-codes/:id`
- `GET /search?q=` minimum 2 characters. Full numbers are not echoed back or stored.
- `POST /phone/parse`, `POST /phone/validate`, `POST /phone/format`
- `POST /newsletter` `{ email }`
- `POST /contact` `{ name, email, message }`

## Admin

All routes under `/admin` except login require `Authorization: Bearer`.

- `POST /admin/auth/login`
- `GET /admin/me`
- `GET /admin/dashboard`
- Country, region, city and area-code create, update and soft-delete routes
- `POST /admin/area-codes/:id/verify`
- `POST /admin/import/preview`, `POST /admin/import/csv`, `POST /admin/import/json`
- `GET /admin/countries/export`
- `GET /admin/audit-logs`
- `GET /admin/search-logs`
- `GET /admin/users`, `POST /admin/users`
- `GET /admin/settings`, `PUT /admin/settings`

Roles: `super_admin`, `admin`, `editor`, `reviewer`, `analyst`. Editors cannot delete. Only a super admin can create users. Reviewers can verify.
