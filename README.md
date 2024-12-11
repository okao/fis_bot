# Getting Started

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

## After Schema Changes

```bash
bunx drizzle-kit generate --config=drizzle.config.ts
```

## Migrate

```bash
# bun run src/lib/db/migrate.ts
#bunx drizzle-kit generate --out ./supabase/migrations --schema ./src/lib/supabase/schema.ts --dialect postgresql
bunx drizzle-kit push --config ./drizzle.config.ts
```

## Telegram Bot

### To set the webhook, run the following command:

```bash
curl https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook\?url\={NEXT_PUBLIC_URL}/api/bot
```

### To remove the webhook, run the following command:

```bash
curl https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook
```

### To get Information about the webhook, run the following command:

```bash
curl https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo
```