# PoC - User

## Key Frameworks and Libraries

- Hono
- Remix
- Kysely
- Supabase

## Steps

1. [x] Integrate Hono and Remix by installing `hono-remix-adapter`
1. [ ] Integrate Supabase via Kysely

## Logs

### Supabase x Kysely

```sh
pnpx supabase login
pnpx supabase init
pnpx supabase gen types --lang=typescript --project-id <prject ref, like `abcdefghijklmnopqrst`> --schema public > db/supabase.types.ts
# At this point, the database has no user-defined tables.
pnpm run migrate -- create user # Run `kysely-migration-cli` internally.
pnpm run migrate -- up # It created the `user` table on Supabase!
pnpx supabase gen types --lang=typescript --project-id <prject ref, like `abcdefghijklmnopqrst`> --schema public > db/supabase.types.ts # Update the type declaration. We don't need to depend on `kysely-codegen`
```

- <https://supabase.com/docs/guides/deployment/managing-environments>
