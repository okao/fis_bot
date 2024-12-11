import { db } from '../../lib/supabase/db';
import { alerts, type Alert } from '../../lib/supabase/schema';
import { fetchFlightData } from '../../lib/utils/xml-to-json';

export async function searchFlightsReal(
	query: string,
	date?: string,
	userId?: string,
	type?: 'arrivals' | 'departures'
) {
	try {
		// Fetch flights
		const [arrivalFlights, departureFlights] = await Promise.all([
			type === 'departures' ? [] : fetchFlightData('arrivals'),
			type === 'arrivals' ? [] : fetchFlightData('departures'),
		]);

		// If userId provided, get user's alerts
		let userAlerts: Alert[] = [];
		if (userId) {
			userAlerts = await db.select().from(alerts);
		}

		// Create a Set for faster lookups
		const alertSet = new Set(
			userAlerts.map(
				(alert) => `${alert.flight_no}_${alert.date}_${alert.type}`
			)
		);

		// Filter and format flights with alert status
		const filteredArrivals = arrivalFlights
			.filter(
				(flight) =>
					(!date || flight.date === date) &&
					(!query ||
						flight.flightNo
							.toLowerCase()
							.includes(query.toLowerCase()) ||
						flight.airlineName
							.toLowerCase()
							.includes(query.toLowerCase()) ||
						flight.route1.toLowerCase().includes(query.toLowerCase()))
			)
			.map((flight) => ({
				...flight,
				hasAlert: alertSet.has(
					`${flight.flightNo}_${flight.date}_arrival`
				),
			}));

		const filteredDepartures = departureFlights
			.filter(
				(flight) =>
					(!date || flight.date === date) &&
					(!query ||
						flight.flightNo
							.toLowerCase()
							.includes(query.toLowerCase()) ||
						flight.airlineName
							.toLowerCase()
							.includes(query.toLowerCase()) ||
						flight.route1.toLowerCase().includes(query.toLowerCase()))
			)
			.map((flight) => ({
				...flight,
				hasAlert: alertSet.has(
					`${flight.flightNo}_${flight.date}_departure`
				),
			}));

		return {
			arrivals: filteredArrivals,
			departures: filteredDepartures,
		};
	} catch (error) {
		console.error('Error searching flights:', error);
		return { arrivals: [], departures: [] };
	}
}
