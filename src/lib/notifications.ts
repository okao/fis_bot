import { db } from '@/lib/supabase/db';
import { alerts, alertNotifications } from '@/lib/supabase/schema';
import { and, eq } from 'drizzle-orm';
import { sendTelegramMessage } from './telegram';
import { searchFlightsReal } from './db/queries';

export async function checkAndSendAlerts() {
	// Get active alerts
	const activeAlerts = await db
		.select()
		.from(alerts)
		.where(
			and(
				eq(alerts.is_active, true),
				eq(alerts.flight_status, '') // not landed
			)
		);

	for (const alert of activeAlerts) {
		try {
			const { arrivals, departures } = await searchFlightsReal(
				alert.flight_no,
				alert.date
			);

			const flight =
				alert.type === 'arrival' ? arrivals[0] : departures[0];

			if (!flight) continue;

			// Check if status changed
			if (flight.status !== alert.flight_status) {
				await recordNotification(
					alert.id,
					alert.flight_no,
					alert.date,
					flight.status,
					'status_change'
				);

				await sendTelegramMessage(
					alert.chat_id,
					`✈️ Flight ${alert.flight_no} status updated to: ${flight.status}`
				);

				// Update alert status
				await db
					.update(alerts)
					.set({
						flight_status: flight.status,
						last_notified: new Date(),
					})
					.where(eq(alerts.id, alert.id));
			}

			// Check for arrival reminders
			if (alert.type === 'arrival' && flight.estimated) {
				const estimatedTime = parseTime(flight.estimated);
				const now = new Date();
				const timeDiff = estimatedTime.getTime() - now.getTime();
				const minutesDiff = Math.floor(timeDiff / (1000 * 60));

				console.log('minutesDiff', minutesDiff);

				// Send 30-minute reminder
				if (minutesDiff <= 30 && minutesDiff > 25) {
					await recordNotification(
						alert.id,
						alert.flight_no,
						alert.date,
						flight.status,
						'reminder'
					);

					await sendTelegramMessage(
						alert.chat_id,
						`⏰ Reminder: Flight ${
							alert.flight_no
						} is scheduled to arrive in 30 minutes! \n\nGate: ${
							flight.gate || 'TBA'
						} at ${flight.estimated}`
					);
				}
			}
		} catch (error) {
			console.error(`Error processing alert ${alert.id}:`, error);
		}
	}
}

// Parse time string to Date object with Maldives timezone (+5)
function parseTime(timeString: string) {
	const [hours, minutes] = timeString.split(':').map(Number);
	const date = new Date();
	date.setHours(hours, minutes, 0, 0);
	return date;
}

async function recordNotification(
	alertId: string,
	flightNo: string,
	date: string,
	status: string | null,
	type: string
) {
	const alert = await db
		.select()
		.from(alerts)
		.where(eq(alerts.id, alertId))
		.limit(1);

	if (!alert.length) return;

	await db.insert(alertNotifications).values({
		id: `${alertId}_${status || 'reminder'}_${
			alert[0].user_id
		}_${Date.now()}`,
		alert_id: alertId,
		user_id: alert[0].user_id,
		chat_id: alert[0].chat_id,
		flight_no: flightNo,
		date,
		status,
		type,
	});
}
