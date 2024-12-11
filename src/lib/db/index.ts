import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Increase max listeners for process
process.setMaxListeners(25);

const connectionString = process.env.POSTGRES_URL!;

// Single global pool instance
let globalPool: ReturnType<typeof postgres> | null = null;

// Get or create pool
function getPool() {
	if (!globalPool) {
		globalPool = postgres(connectionString, {
			max: 20,
			idle_timeout: 20,
			connect_timeout: 10,
		});
	}
	return globalPool;
}

// Create db instance
export const db = drizzle(getPool());

// Cleanup handler - only add once
let cleanupRegistered = false;
if (!cleanupRegistered) {
	process.once('SIGTERM', async () => {
		if (globalPool) {
			await globalPool.end();
			globalPool = null;
		}
	});
	cleanupRegistered = true;
}
