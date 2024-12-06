import { initCron } from '@/lib/cron';

// Initialize on server start
if (process.env.NODE_ENV === 'production') {
	initCron();
}

export async function GET() {
	return new Response('Cron initialized');
}
