# PoC - User

## Key Frameworks and Libraries

- Hono
- Remix
- Kysely
- Supabase

## Steps

- [x] Integrate Hono and Remix by installing `hono-remix-adapter`
- [x] Integrate Supabase via Kysely
- [x] Migrate from Cloudflare Pages to Cloudflare Workers
- [ ] Build self-managed login, user roles, and user sessions based on [EpicWeb](https://www.epicweb.dev/)
- [ ] Oauth (GitHub)

## Logs

### Supabase x Kysely

```sh
pnpx supabase login
pnpx supabase init
pnpx supabase gen types --lang=typescript --project-id <project ref, like `abcdefghijklmnopqrst`> --schema public > db/supabase.types.ts
# At this point, the database has no user-defined tables.
pnpm run migrate -- create user # Run `kysely-migration-cli` internally.
pnpm run migrate -- up # It created the `user` table on Supabase!
### NOTE: The type generator by supabase generates string type for datetime. This is critical as Kysely generates it to Date. Let's go back to `kysely-codegen`.
# pnpx supabase pull # Update the migration files under `supabase/migrations`
# pnpm run supabase:gen # Update the type declaration. We don't need to depend on `kysely-codegen`
pnpm run generate-dotenv-for-ky-typegen # Only once. It generates the `.env` file that has to be used by only kysely-codegen
pnpm run ky-typegen
```

- <https://supabase.com/docs/guides/deployment/managing-environments>
