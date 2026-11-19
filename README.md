# Brewer Family Companies

Public family and Bricktown history website, with versioned source on GitHub and public content in Supabase.

- Website: https://brewer-family-companies.brett-brewer-9683.chatgpt.site/
- Database: https://supabase.com/dashboard/project/mskkrcbrsvfkiynqtaic
- Supabase organization: Brewer Family companies
- Hosted database region: us-east-2

## Content and access

The database holds 16 company stories, 27 timeline milestones, 145 archive entries, 19 source references, and 9 image/video records. Published rows are publicly readable. Only explicitly assigned editor accounts can change content or read drafts. Browser clients cannot assign themselves editor access. No editor account is assigned initially.

The site reads published content through the REST API using a browser-safe publishable key in `dist/database-config.js`. Its existing HTML stays available as a fallback if loading fails. Photos remain in the published website assets; the database stores their URLs, credits, and treatment metadata. Existing photo layouts remain in HTML. Private Brewer AI records are outside this public database.

## Local development

Requires Node 22+, Python 3, and Docker for the local database. The CLI is pinned to Supabase 3.1.0 in the lockfile.

```sh
npm ci
npm run db:start
npm run db:reset
python3 -m http.server 8766 --directory dist
```

To point the browser at a local database, temporarily use the local API URL and publishable key reported by `npx supabase status` in `dist/database-config.js`. Do not commit local settings over the production config. `npm run db:reset` targets only the local database; never reset the hosted project.

## Database source and checks

`supabase/migrations/20261114153703_brewer_history.sql` matches the migration already applied to the hosted project, including its server-generated version. `supabase/content.json` is the initial public snapshot; `python3 scripts/build-seed.py` regenerates `supabase/seed.sql`. Seed conflicts are skipped so replaying the snapshot does not overwrite existing edits. Keep SQL and content files out of `dist/`.

Note: the hosted project also has a later migration, `20261116154252_add_private_event_center_checkout`, which created `bec_checkout_events` and `bec_checkout_settings`. Those are private Event Center business tables (owner-only access, empty as of November 18, 2026). They are not part of this public history site and are intentionally not in this repository; they should move to the private Brewer AI project. Do not run `supabase db pull` here without excluding them.

`npm run check` checks browser JavaScript syntax. The GitHub workflow builds a fresh local Supabase database from the migration and seed, then verifies public draft isolation, non-editor write rejection, editor draft access, and blocked role self-assignment. It never deploys to the hosted project.

For a new change, run `npm run db:migration -- descriptive_name`, edit the generated SQL, and test locally. Supabase CLI v3 defaults to local. A deliberate hosted deployment uses `npx supabase db push --remote=mskkrcbrsvfkiynqtaic --dry-run` followed by the same command without `--dry-run`, after authenticating with Supabase. Review the target and migration before confirming. Never put a database password, access token, service-role key, or secret key in this repository.

Editors can be granted membership by a database administrator in `bfc_private.editors`, using the ID of an existing, verified Supabase Auth user. A separate editor interface is not included. Content can be maintained in the Supabase dashboard or by an authorized database administrator.

Website hosting remains on Sites. Pushing GitHub source does not by itself deploy a new website version. The managed Sites workflow publishes the matching source and static artifact.
