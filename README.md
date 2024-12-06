This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

# After Schema Changes

```bash
bunx drizzle-kit generate --config=drizzle.config.ts
```

# Migrate

```bash
bun run src/lib/db/migrate.ts
```


# Telegram Bot (HOW TO SET WEBHOOK)

```bash
curl https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook\?url\={NEXT_PUBLIC_URL}/api/bot
```
