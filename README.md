# Capgen

Next.js caption editor with Clerk authentication, Neon PostgreSQL persistence, Groq/Deepgram transcription, Dodo checkout/webhooks, and browser-based video/SRT export.

## Local setup

Use Node.js 22 or newer. Run `npm ci`, configure the variables in `.env.example` using your secret manager or gitignored `.env.local`, then run `npm run db:migrate` and `npm run dev`.

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is public; `CLERK_SECRET_KEY` is server-only. Use the same Clerk instance for both.
- `DATABASE_URL` is the pooled Neon application connection. `DATABASE_URL_UNPOOLED` is the direct migration/import connection.
- Auth pages are `/sign-in` and `/sign-up`. Clerk verifies sessions; server APIs determine ownership and credit balances. Neither browser-supplied IDs nor old Capgen cookies authorize access.
- Keep transcription/payment keys server-only. Never commit `.env.local`, `.env.neon-main.local`, `.neon`, or database exports.

## Verification

```powershell
npm run build
npm run typecheck
npm run test:quality
npm run test:database
npm run start -- -p 3001
# In another terminal:
npm run test:journeys
$env:BASE_URL='http://localhost:3001'
npm run test:smoke
npm run test:refinement
$env:SEO_EVIDENCE_LABEL='neon-clerk'
npm run test:seo
npm audit
```

`test:database` targets only the new Capgen development branch. It creates a uniquely named temporary schema and removes only that schema after testing. It does not create Clerk users. `test:journeys` exercises real Clerk UI while signed out; interactive sign-in is a manual check at the user's request.

## Development conventions

Run `npm run format` to format source files, `npm run format:check` to check formatting, and `npm run typecheck` to check types and unused declarations. Tests write screenshots and reports to gitignored evidence directories. Local tooling and historical reports are not part of the published source.

Brand artwork lives in `assets/branding/`. Run `node scripts/generate-brand-assets.mjs` to regenerate the logo and icon sizes from the original image.

See [deployment notes](docs/deployment.md) for hosting configuration, legacy imports and verification boundaries. See [Docker setup](DOCKER.md) for container commands.

Created By DaddyAman
