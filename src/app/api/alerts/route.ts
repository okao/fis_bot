import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts, arrivals, departures } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(request: Request) {
	try {
		const {
			flightNo,
			date,
			userId,
			chatId,
			username,
			firstName,
			type,
		} = await request.json();

		// Check if alert already exists for this flight, date, user and type
		const existingAlert = await db
			.select()
			.from(alerts)
			.where(
				and(
					eq(alerts.userId, userId),
					eq(alerts.flightNo, flightNo),
					eq(alerts.date, date),
					eq(alerts.type, type)
				)
			)
			.limit(1);

		if (existingAlert.length > 0) {
			return NextResponse.json(
				{ error: 'Alert already exists' },
				{ status: 400 }
			);
		}

		// Check if flight exists in arrivals or departures
		const arrival = await db
			.select()
			.from(arrivals)
			.where(
				and(eq(arrivals.flightNo, flightNo), eq(arrivals.date, date))
			)
			.limit(1);

		const departure = await db
			.select()
			.from(departures)
			.where(
				and(
					eq(departures.flightNo, flightNo),
					eq(departures.date, date)
				)
			)
			.limit(1);

		// Create alerts based on flight existence
		const alertsToCreate = [];

		if (arrival.length > 0) {
			alertsToCreate.push({
				id: `${userId}_${flightNo}_${date}_arrival`,
				userId,
				chatId,
				username,
				firstName,
				flightNo,
				date,
				type: 'arrival',
			});
		}

		if (departure.length > 0) {
			alertsToCreate.push({
				id: `${userId}_${flightNo}_${date}_departure`,
				userId,
				chatId,
				username,
				firstName,
				flightNo,
				date,
				type: 'departure',
			});
		}

		if (alertsToCreate.length === 0) {
			return NextResponse.json(
				{ error: 'No valid flights found' },
				{ status: 404 }
			);
		}

		// Insert alerts
		await db.insert(alerts).values(alertsToCreate);

		return NextResponse.json({
			success: true,
			alertsCreated: alertsToCreate.map((a) => a.type),
		});
	} catch (error) {
		console.error('Error creating alert:', error);
		return NextResponse.json(
			{ error: 'Failed to create alert' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { flightNo, date, userId, type } = await request.json();

		// Delete specific alert type if provided, otherwise delete both
		const deleteConditions = [
			eq(alerts.userId, userId),
			eq(alerts.flightNo, flightNo),
			eq(alerts.date, date),
		];

		if (type) {
			deleteConditions.push(eq(alerts.type, type));
		}

		await db.delete(alerts).where(and(...deleteConditions));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting alert:', error);
		return NextResponse.json(
			{ error: 'Failed to delete alert' },
			{ status: 500 }
		);
	}
}
