import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL!;

// For migrations, we need a different connection config
const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function main() {
	console.log('Migration started...');
	await migrate(db, { migrationsFolder: './src/lib/db/migrations' });
	console.log('Migration completed');
	await migrationClient.end();
}

main().catch((err) => {
	console.error('Migration failed');
	console.error(err);
	process.exit(1);
});
