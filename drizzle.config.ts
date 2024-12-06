import type { Config } from 'drizzle-kit';

const config: Config = {
	dialect: 'postgresql', // or "mysql", "sqlite", etc.
	out: './src/lib/db/migrations',
	schema: './src/lib/db/schema.ts',
	dbCredentials: {
		port: parseInt(process.env.POSTGRES_PORT!),
		user: process.env.POSTGRES_USER!,
		password: process.env.POSTGRES_PASSWORD!,
		database: process.env.POSTGRES_DB!,
		host: process.env.POSTGRES_HOST!,
	},
};

export default config;
