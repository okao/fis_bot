import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigrations = async () => {
	const connectionString =
		process.env.NEXT_PUBLIC_SUPABASE_URL + '?sslmode=require';
	const sql = postgres(connectionString, { max: 1 });
	const db = drizzle(sql);

	console.log('Running migrations...');

	await migrate(db, {
		migrationsFolder: 'src/lib/supabase/migrations',
	});

	console.log('Migrations completed!');
	await sql.end();
};

runMigrations().catch(console.error);
