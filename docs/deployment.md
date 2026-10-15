# Deployment

Use the Vercel project connected to this repository. Configure the variables listed in `.env.example` in the hosting environment, never in committed files.

## Authentication and storage

- Use paired Clerk production keys for the public domain. Configure the production domain, DNS and social-provider credentials in Clerk before switching keys. The Clerk CLI's interactive `deploy` wizard must run in a human terminal; verify it afterward with `clerk deploy status --mode agent`.
- Redeploy after changing the public Clerk key: it is compiled into the browser bundle and the content security policy.
- Set `CLERK_AUTHORIZED_PARTIES` to the actual public origins. Do not widen the list to arbitrary domains.
- Use the Neon main pooled connection for runtime requests and its direct connection for migrations. Keep local development and production databases separate.
- Run `npm run db:migrate` against the intended direct connection before publishing schema changes. Migrations are versioned and checksum-checked.

## Existing accounts

Old Firebase sessions do not authorize Clerk requests. Existing users must sign in through Clerk. Legacy accounts, projects and balances require an explicit import; they do not appear automatically in a new database.

The importer accepts a reviewed version-1 normalized JSON export with `users`, `projects` and `billingEvents` arrays. `scripts/fixtures/legacy-account.json` documents the format with test data. It is not a parser for managed Firestore protobuf backups.

Store private input under gitignored `migration-inputs/`. Validate without writing:

```powershell
npm run db:import-legacy -- --file=migration-inputs/reviewed.json
```

Apply only after verifying the configured project and branch:

```powershell
npm run db:import-legacy -- --file=migration-inputs/reviewed.json --apply --confirm-project=YOUR_PROJECT_ID
```

Imports preserve internal IDs, credit balances, project revisions, paid-export flags and hashed billing receipts. Conflicts roll back instead of overwriting live accounts. A verified primary Clerk email links an imported account to its owner. Reconcile accounts created before import rather than resetting balances.

Keep Firebase data intact until ownership and balances have been reconciled. Original source videos stay on users' devices and are not part of this import.

## Payments and verification

Enable public checkout only with reviewed live Dodo credentials, products and webhook configuration. Test-mode credentials are not live billing. Duplicate webhook delivery IDs are idempotent, but separate payment/subscription events can represent the same transaction and require provider-specific reconciliation.

Run the build, typecheck, formatting check, contract tests and signed-out browser tests before deploying. The database suite requires the designated development branch and creates only a temporary test schema. It does not create Clerk users.

Interactive sign-in, email/social-provider setup, paid checkout, saved-project recovery and production account isolation require authenticated staging checks. Signed-out tests and a successful build do not certify these flows. Docker requires a separate build/run check on a host with Docker installed.
