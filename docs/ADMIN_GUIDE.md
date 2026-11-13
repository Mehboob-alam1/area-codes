# Administrator guide

Sign in at `/admin`.

The first local account is created from `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD`. The development defaults are in `backend/.env.example`.

## Roles

| Role | Can do |
|---|---|
| Super admin | Everything, including new administrator accounts |
| Admin | Directory, import, export, settings, audit and analytics |
| Editor | Create and edit records, import and export. Cannot delete. |
| Reviewer | Read records and mark verification |
| Analyst | Read records, analytics and the audit log |

## Records

New countries, regions, cities and area codes can be saved as drafts. Deleting a record hides it and keeps the previous values in the audit log.

An area code that already exists for a country should gain another location instead of a second row. The API rejects that duplicate.

Leave a city without an area code when you do not have a source. The public page will say the code is not on file.

## Imports

Paste CSV on the Imports page, preview it, then confirm. Invalid rows block the import. Confirmed rows are created as drafts. Duplicate ISO codes are skipped.

## Verification

Verify only after checking the current national numbering plan. The public site labels everything else as unverified.
