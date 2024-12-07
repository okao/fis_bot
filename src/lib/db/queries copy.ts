import { db } from '@/lib/db';
import { arrivals, departures, alerts } from '@/lib/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

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
