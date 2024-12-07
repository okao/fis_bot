import cron from 'node-cron';
import { syncFlights } from './sync/flights';
import { checkAndSendAlerts } from './notifications';

export function initCron() {
	// Sync flights every 5 minutes
	cron.schedule('*/30 * * * *', async () => {
		try {
			console.log('Starting flight sync...');
			const result = await syncFlights();
			console.log('Sync completed:', result);
		} catch (error) {
			console.error('Sync failed:', error);
		}
	});

	// Check alerts every 2 minutes
	cron.schedule('*/2 * * * *', async () => {
		try {
			console.log('Checking flight alerts...');
			await checkAndSendAlerts();
			console.log('Alert check completed');
		} catch (error) {
			console.error('Alert check failed:', error);
		}
	});
}
