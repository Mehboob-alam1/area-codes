# Security

- Helmet sets response headers. CORS allows only `CORS_ORIGIN`.
- JSON bodies are limited to 2 MB.
- Public, phone and sign-in routes are rate limited.
- Request bodies are checked with Zod.
- Queries run against the application store, not string-built SQL.
- Passwords are hashed with scrypt. Five failed sign-ins lock an email for 15 minutes.
- Administrator routes check a signed token and a role permission.
- Audit entries redact password hashes.
- Search logs hash any query with eight or more digits.
- Supabase policies allow anonymous reads of published records only. There is no anonymous write policy.
- The service-role key and the JWT secret stay on the server. Frontend variables are the public API address and, when used, the Supabase anon key.

Production must set `ADMIN_JWT_SECRET`. Do not deploy the development password.
