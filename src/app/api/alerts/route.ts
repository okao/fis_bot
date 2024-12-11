import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/db';
import { alerts, users } from '@/lib/supabase/schema';
import { and, eq } from 'drizzle-orm';
import { searchFlightsReal } from '@/lib/db/queries';

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

		// First, ensure user exists or create them
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!existingUser.length) {
			await db.insert(users).values({
				id: userId,
				platform: 'telegram',
				username,
				first_name: firstName,
				chat_id: chatId,
				is_active: true,
			});
		}

		// Check for existing alert
		const existingAlert = await db
			.select()
			.from(alerts)
			.where(
				and(
					eq(alerts.user_id, userId),
					eq(alerts.flight_no, flightNo),
					eq(alerts.date, date),
					eq(alerts.type, type)
				)
			)
			.limit(1);

		if (existingAlert.length > 0 && existingAlert[0].is_active) {
			return NextResponse.json(
				{ error: 'Alert already exists' },
				{ status: 400 }
			);
		}

		// Get flight details
		const { arrivals, departures } = await searchFlightsReal(
			flightNo,
			date,
			undefined,
			type as 'arrivals' | 'departures'
		);

		const flight = type === 'arrival' ? arrivals[0] : departures[0];
		if (!flight) {
			return NextResponse.json(
				{ error: 'Flight not found' },
				{ status: 404 }
			);
		}

		// Create alert
		await db.insert(alerts).values({
			id: `${userId}_${flightNo}_${date}_${type}`,
			user_id: userId,
			chat_id: chatId,
			username,
			firstName,
			flight_no: flightNo,
			date,
			type,
			flight_status: flight.status,
			is_active: true,
		});

		return NextResponse.json({ success: true });
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

		await db
			.update(alerts)
			.set({ is_active: false })
			.where(
				and(
					eq(alerts.user_id, userId),
					eq(alerts.flight_no, flightNo),
					eq(alerts.date, date),
					type ? eq(alerts.type, type) : undefined
				)
			);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting alert:', error);
		return NextResponse.json(
			{ error: 'Failed to delete alert' },
			{ status: 500 }
		);
	}
}
