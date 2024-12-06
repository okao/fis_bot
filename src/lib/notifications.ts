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
	const activeAlerts = await db
		.select()
		.from(alerts)
		.where(eq(alerts.isActive, true));

	for (const alert of activeAlerts) {
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

		// Check for status changes
		if (currentFlight.status) {
			// Check if this specific status has been sent to this user
			const alreadyNotified = await hasNotificationBeenSent(
				alert.id, // This includes userId in the composite key
				alert.flightNo,
				alert.date,
				currentFlight.status
			);

			console.log('Status notification check:', {
				alertId: alert.id,
				userId: alert.userId,
				flightNo: alert.flightNo,
				currentStatus: currentFlight.status,
				alreadyNotified,
			});

			if (!alreadyNotified) {
				const statusMessage = getStatusMessage(currentFlight.status);
				await sendTelegramMessage(
					alert.chatId,
					`🔔 Flight ${
						alert.flightNo
					} Status Update:\n${statusMessage}\n\nGate: ${
						currentFlight.gate || 'TBA'
					}`
				);

				// Record this notification for this specific user
				await recordNotification(
					alert.id, // Contains userId
					alert.flightNo,
					alert.date,
					currentFlight.status
				);
			}
		}

		// Check for estimated time
		if (currentFlight.estimated) {
			const estimatedTime = parseTime(currentFlight.estimated);
			const now = new Date();
			const timeDiff = estimatedTime.getTime() - now.getTime();
			const minutesDiff = Math.floor(timeDiff / (1000 * 60));

			// Different notification types based on time
			const notificationTypes = [
				{ minutes: 60, type: 'reminder_60' },
				{ minutes: 30, type: 'reminder_30' },
				{ minutes: 15, type: 'reminder_15' },
			];

			const ltMinutes = 5;

			for (const { minutes, type } of notificationTypes) {
				if (
					minutesDiff <= minutes &&
					minutesDiff > minutes - ltMinutes
				) {
					const alreadyNotified = await hasNotificationBeenSent(
						alert.id,
						alert.flightNo,
						alert.date,
						type
					);

					console.log('alreadyNotified', [
						minutes,
						type,
						alreadyNotified,
					]);

					if (!alreadyNotified) {
						await sendTelegramMessage(
							alert.chatId,
							`⏰ Reminder: Flight ${
								alert.flightNo
							} is scheduled in ${minutes} minutes!\n\nGate: ${
								currentFlight.gate || 'TBA'
							}`
						);
						await recordNotification(
							alert.id,
							alert.flightNo,
							alert.date,
							type
						);
					}
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

async function hasNotificationBeenSent(
	alertId: string,
	flightNo: string,
	date: string,
	status: string | null
): Promise<boolean> {
	const alert = await db
		.select()
		.from(alerts)
		.where(eq(alerts.id, alertId))
		.limit(1);

	if (!alert.length) return false;

	const existing = await db
		.select()
		.from(alertNotifications)
		.where(
			and(
				eq(alertNotifications.userId, alert[0].userId),
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
	const alert = await db
		.select()
		.from(alerts)
		.where(eq(alerts.id, alertId))
		.limit(1);

	if (!alert.length) return;

	console.log('Recording notification:', {
		alertId,
		userId: alert[0].userId,
		chatId: alert[0].chatId,
		flightNo,
		date,
		status,
	});

	// return;

	await db.insert(alertNotifications).values({
		id: `${alertId}_${status || 'reminder'}_${
			alert[0].userId
		}_${Date.now()}`,
		alertId,
		userId: alert[0].userId,
		chatId: alert[0].chatId,
		flightNo,
		date,
		status,
	});

	return true;
}
