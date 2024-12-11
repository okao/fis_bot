import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function connectWithRetry() {
	let retries = 0;

	while (retries < MAX_RETRIES) {
		try {
			const sql = postgres(process.env.POSTGRES_URL!, {
				max: 2,
				idle_timeout: 20,
				connect_timeout: 10,
			});

			return drizzle(sql);
		} catch (error) {
			retries++;
			console.error(
				`Database connection attempt ${retries} failed:`,
				error
			);
			if (retries === MAX_RETRIES) throw error;
			await new Promise((resolve) =>
				setTimeout(resolve, RETRY_DELAY)
			);
		}
	}
}
