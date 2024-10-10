# Preparation

1. Copy `.env.example` as `.env` and fill in the missing values.
2. Run `pnpm install`.
3. Run `pnpm dev`.
4. Run `$ docker compose up -d`.
5. Go to `http://localhost:3000/seed` to seed the database.
6. Check `app/lib/placeholder-data.ts` for login email and password.

# Run

```bash
$ docker compose up -d
```

```bash
$ pnpm dev
```

# Lint

```bash
$ pnpm lint
```

# Reference

https://nextjs.org/learn/dashboard-app
