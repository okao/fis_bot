import { db } from '@/lib/db';
import { arrivals, departures } from '@/lib/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

export async function searchFlights(query: string, date?: string) {
	const likeQuery = `%${query.toUpperCase()}%`;

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
		arrivals: arrivalFlights,
		departures: departureFlights,
	};
}
