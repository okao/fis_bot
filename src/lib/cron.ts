import cron from 'node-cron';
import { syncFlights } from './sync/flights';

export function initCron() {
	// Run every 5 minutes
	cron.schedule('*/5 * * * *', async () => {
		try {
			console.log('Starting flight sync...');
			const result = await syncFlights();
			console.log('Sync completed:', result);
		} catch (error) {
			console.error('Sync failed:', error);
		}
	});
}
