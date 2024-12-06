import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL!;

// Create a new postgres client
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client);
