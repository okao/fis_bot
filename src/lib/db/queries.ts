import { db } from '@/lib/db';
import { arrivals, departures, alerts } from '@/lib/db/schema';
import { eq, like, and, or } from 'drizzle-orm';
import { fetchFlightData } from '@/lib/utils/xml-to-json';
export async function searchFlights(
	query: string,
	date?: string,
	userId?: string
) {
	console.log('Searching flights with:', { query, date, userId });

	const likeQuery = `%${query.toUpperCase()}%`;

	// Get user's alerts if userId is provided
	const userAlerts = userId
		? await db
				.select()
				.from(alerts)
				.where(
					and(eq(alerts.userId, userId), eq(alerts.isActive, true))
				)
		: [];

	console.log('Found user alerts:', userAlerts);

	// Create a Set for faster lookups
	const alertSet = new Set(
		userAlerts.map((alert) => `${alert.flightNo}_${alert.date}`)
	);

	// Get arrivals
	//https://fis.com.mv/xml/arrive.xml
	const arrivalFlights = await db
		.select()
		.from(arrivals)
		.where(
			and(
				date ? eq(arrivals.date, date) : undefined,
				query
					? or(
							like(arrivals.flightNo, likeQuery),
							like(arrivals.airlineName, likeQuery),
							like(arrivals.route1, likeQuery)
					  )
					: undefined
			)
		)
		.orderBy(arrivals.scheduled);

	// Get departures
	//https://fis.com.mv/xml/depart.xml
	const departureFlights = await db
		.select()
		.from(departures)
		.where(
			and(
				date ? eq(departures.date, date) : undefined,
				query
					? or(
							like(departures.flightNo, likeQuery),
							like(departures.airlineName, likeQuery),
							like(departures.route1, likeQuery)
					  )
					: undefined
			)
		)
		.orderBy(departures.scheduled);

	return {
		arrivals: arrivalFlights.map((flight) => ({
			...flight,
			hasAlert: alertSet.has(`${flight.flightNo}_${flight.date}`),
		})),
		departures: departureFlights.map((flight) => ({
			...flight,
			hasAlert: alertSet.has(`${flight.flightNo}_${flight.date}`),
		})),
	};
}

export async function searchFlightsReal(
	query: string,
	date?: string,
	userId?: string,
	type?: 'arrivals' | 'departures'
) {
	console.log('Searching real-time flights with:', {
		query,
		date,
		userId,
		type,
	});

	try {
		// Fetch based on type
		const [arrivalFlights, departureFlights] = await Promise.all([
			type === 'departures' ? [] : fetchFlightData('arrivals'),
			type === 'arrivals' ? [] : fetchFlightData('departures'),
		]);

		// Get user's alerts if userId is provided
		const userAlerts = userId
			? await db
					.select()
					.from(alerts)
					.where(
						and(eq(alerts.userId, userId), eq(alerts.isActive, true))
					)
			: [];

		// Create a Set for faster lookups
		const alertSet = new Set(
			userAlerts.map((alert) => `${alert.flightNo}_${alert.date}`)
		);

		// Filter and format flights
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
				hasAlert: alertSet.has(`${flight.flightNo}_${flight.date}`),
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
				hasAlert: alertSet.has(`${flight.flightNo}_${flight.date}`),
			}));

		return {
			arrivals: filteredArrivals,
			departures: filteredDepartures,
		};
	} catch (error) {
		console.error('Error searching real-time flights:', error);
		// Fallback to database search if real-time fails
		return searchFlights(query, date, userId);
	}
}
