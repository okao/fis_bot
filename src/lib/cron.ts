import cron from 'node-cron';
import { checkAndSendAlerts } from './notifications';

export function initCron() {
	// Sync flights every 15 minutes
	// cron.schedule('*/15 * * * *', async () => {
	// 	try {
	// 		console.log('Starting flight sync...');
	// 		const result = await syncFlights();
	// 		console.log('Sync completed:', result);
	// 	} catch (error) {
	// 		console.error('Sync failed:', error);
	// 	}
	// });

	// Check alerts every 5 minutes
	cron.schedule('*/5 * * * *', async () => {
		try {
			console.log('Checking flight alerts...');
			await checkAndSendAlerts();
			console.log('Alert check completed');
		} catch (error) {
			console.error('Alert check failed:', error);
		}
	});
}
