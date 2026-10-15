# Docker setup

Configure `.env.local` from `.env.example`. Both Neon connection strings and the Clerk secret stay in runtime environment files, never build arguments. Only the public Clerk publishable key is needed during the image build.

For development: `docker compose --env-file .env.local up -d --build dev`.

For a production-mode local preview: `docker compose --env-file .env.local --profile prod up -d --build prod` (stop the dev service first because both use the same default host port).

The production-mode preview is not a production Clerk deployment. Configure the production Clerk instance/domain and matching hosting secrets before publishing. Run `npm run db:migrate` from an authorized environment with the direct Neon URL before the app is used; do not run migrations automatically during image builds. Runtime requests use the pooled URL.

Secrets, database exports, agent output and verification media are excluded from Docker's build context. Original user videos remain on the client; the app container does not need a local video store.
