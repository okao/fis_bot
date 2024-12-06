import { db } from '@/lib/db';
import {
	alerts,
	arrivals,
	departures,
	alertNotifications,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendTelegramMessage } from './telegram';

export async function checkAndSendAlerts() {
	// Get all active alerts
	const activeAlerts = await db
		.select()
		.from(alerts)
		.where(eq(alerts.isActive, true));

	for (const alert of activeAlerts) {
		// Check both arrivals and departures
		const flight = await db
			.select()
			.from(arrivals)
			.where(
				and(
					eq(arrivals.flightNo, alert.flightNo),
					eq(arrivals.date, alert.date)
				)
			)
			.union(
				db
					.select()
					.from(departures)
					.where(
						and(
							eq(departures.flightNo, alert.flightNo),
							eq(departures.date, alert.date)
						)
					)
			);

		if (!flight.length) continue;
		const currentFlight = flight[0];

		// Get previous notification details
		const lastNotified = alert.lastNotified;
		const lastStatus = lastNotified
			? await getPreviousStatus(currentFlight.id)
			: null;

		// Check for status changes
		if (currentFlight.status && currentFlight.status !== lastStatus) {
			const alreadySent = await hasNotificationBeenSent(
				alert.id,
				alert.flightNo,
				alert.date,
				currentFlight.status
			);

			if (!alreadySent) {
				const statusMessage = getStatusMessage(currentFlight.status);
				await sendTelegramMessage(
					alert.chatId,
					`🔔 Flight ${
						alert.flightNo
					} Status Update:\n${statusMessage}\n\nGate: ${
						currentFlight.gate || 'TBA'
					}`
				);
				await recordNotification(
					alert.id,
					alert.flightNo,
					alert.date,
					currentFlight.status
				);
				await updateLastNotified(alert.id);
			}
		}

		// Check for upcoming flight (15 minutes before)
		if (currentFlight.estimated) {
			const estimatedTime = parseTime(currentFlight.estimated);
			const now = new Date();
			const timeDiff = estimatedTime.getTime() - now.getTime();
			const minutesDiff = Math.floor(timeDiff / (1000 * 60));

			if (
				minutesDiff <= 15 &&
				minutesDiff > 0 &&
				(!lastNotified || isMoreThanHourAgo(lastNotified))
			) {
				const alreadySent = await hasNotificationBeenSent(
					alert.id,
					alert.flightNo,
					alert.date,
					'reminder'
				);

				if (!alreadySent) {
					await sendTelegramMessage(
						alert.chatId,
						`⏰ Reminder: Flight ${
							alert.flightNo
						} is scheduled in ${minutesDiff} minutes!\n\nGate: ${
							currentFlight.gate || 'TBA'
						}`
					);
					await recordNotification(
						alert.id,
						alert.flightNo,
						alert.date,
						'reminder'
					);
					await updateLastNotified(alert.id);
				}
			}
		}
	}
}

function getStatusMessage(status: string): string {
	const statusMap: Record<string, string> = {
		DP: '✈️ Flight has Departed',
		DE: '✈️ Flight has Departed',
		GZ: '🚪 Gate is now Closed',
		AR: '🛬 Flight has Arrived',
		CK: '📝 Check-in is Open',
		DL: '⚠️ Flight is Delayed',
		BS: '🚶 Boarding has Started',
		CN: '❌ Flight is Cancelled',
		ON: '✅ Flight is On-time',
		FT: '✈️ Flight is In-air',
		LX: '🛬 Flight is Landing',
		LA: '🛬 Flight has Landed',
	};

	return statusMap[status] || `Status changed to: ${status}`;
}

function parseTime(timeString: string): Date {
	const [hours, minutes] = timeString.split(':').map(Number);
	const date = new Date();
	date.setHours(hours, minutes, 0, 0);
	return date;
}

function isMoreThanHourAgo(date: Date): boolean {
	return new Date().getTime() - date.getTime() > 60 * 60 * 1000;
}

async function updateLastNotified(alertId: string) {
	await db
		.update(alerts)
		.set({ lastNotified: new Date() })
		.where(eq(alerts.id, alertId));
}

async function getPreviousStatus(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	flightId: string
): Promise<string | null> {
	// You might want to implement a flight history table to track this
	return null;
}

async function hasNotificationBeenSent(
	alertId: string,
	flightNo: string,
	date: string,
	status: string | null
): Promise<boolean> {
	const existing = await db
		.select()
		.from(alertNotifications)
		.where(
			and(
				eq(alertNotifications.alertId, alertId),
				eq(alertNotifications.flightNo, flightNo),
				eq(alertNotifications.date, date),
				eq(alertNotifications.status, status || '')
			)
		)
		.limit(1);

	return existing.length > 0;
}

async function recordNotification(
	alertId: string,
	flightNo: string,
	date: string,
	status: string | null
) {
	await db.insert(alertNotifications).values({
		id: `${alertId}_${status || 'reminder'}_${Date.now()}`,
		alertId,
		flightNo,
		date,
		status,
	});
}
