# Database schema

`database/migrations/001_initial.sql` is the Supabase schema.

Area codes are not forced into a single city. `area_codes` stores the code once per country. `area_code_locations` attaches that code to zero or more regions and cities. A row with no city is a country-level numbering record, such as a NANP code that is not mapped to one municipality.

Important constraints:

- Active country slugs, ISO alpha-2 and ISO alpha-3 codes are unique.
- An active area code is unique per country, so a shared code is one record with several locations.
- Status is `draft`, `published` or `unpublished`.
- Verification is `pending`, `verified`, `outdated`, `conflicting` or `rejected`.
- Row Level Security lets anonymous clients read published records only. Writes use the service role through the API, which enforces roles in the application.

The local store in `database/data/store.json` uses the same names in camelCase. It is created from `database/seeds/directory-seed.json` on first boot.
