import { syncFlights } from '@/lib/sync/flights';

async function main() {
	console.log('Starting flight sync...');
	const result = await syncFlights();
	if (result.success) {
		console.log('Flights synced successfully');
	} else {
		console.error('Failed to sync flights:', result.error);
	}
}

main();
