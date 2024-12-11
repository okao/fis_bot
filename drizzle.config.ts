// import fs from 'fs';
import { defineConfig } from 'drizzle-kit';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// export default defineConfig({
// 	schema: './src/lib/supabase/schema.ts',
// 	out: './supabase/migrations',
// 	dialect: 'postgresql',
// 	dbCredentials: {
// 		url: 'postgresql://postgres.jscjcybnrytmmwqpvzmw:CZY7zQbeDgywu1mc@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
// 		ssl: {
// 			ca: fs
// 				.readFileSync('./src/lib/supabase/prod-ca-2021.crt')
// 				.toString(),
// 			rejectUnauthorized: true, // Enforce certificate validation
// 		},
// 	},
// });

const connectionString = process.env.DATABASE_URL!;

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);

export default defineConfig({
	schema: './src/lib/supabase/schema.ts',
	out: './supabase/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		host: process.env.DB_HOST!,
		port: parseInt(process.env.DB_PORT!),
		user: process.env.DB_USER!,
		password: process.env.DB_PASSWORD!,
		database: process.env.DB_NAME!,
		ssl: 'require',
	},
});
// export default db;
