import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendTelegramMessage } from '@/lib/telegram';
import { getMaldivesTimestamp } from '@/lib/utils/date';

export async function POST(request: Request) {
	try {
		const { flightNo, date, userId, chatId, username, firstName } =
			await request.json();

		// Check if alert already exists
		const existingAlert = await db
			.select()
			.from(alerts)
			.where(
				and(
					eq(alerts.userId, userId),
					eq(alerts.flightNo, flightNo),
					eq(alerts.date, date),
					eq(alerts.isActive, true)
				)
			)
			.limit(1);

		if (existingAlert.length > 0) {
			return NextResponse.json(
				{ error: 'Alert already exists for this flight' },
				{ status: 400 }
			);
		}

		await db.insert(alerts).values({
			id: `${userId}_${flightNo}_${date}`,
			userId,
			chatId,
			username,
			firstName,
			flightNo,
			date,
			createdAt: getMaldivesTimestamp(),
			isActive: true,
		});

		// Send confirmation message
		await sendTelegramMessage(
			chatId,
			`✈️ Alert set for flight ${flightNo} on ${date}\n\nYou will be notified of any changes.`
		);

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
		const { flightNo, date, userId, chatId } = await request.json();

		await db
			.delete(alerts)
			.where(
				and(
					eq(alerts.userId, userId),
					eq(alerts.flightNo, flightNo),
					eq(alerts.date, date)
				)
			);

		// Send confirmation message
		await sendTelegramMessage(
			chatId,
			`❌ Alert removed for flight ${flightNo}`
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
