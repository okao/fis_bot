import { db } from '@/lib/db';
import {
	alerts,
	arrivals,
	departures,
	alertNotifications,
} from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { sendTelegramMessage } from './telegram';

// const getCurrentFlight = async (
// 	flightNo: string,
// 	date: string
// ): Promise<Flight | null> => {

// 	return flight.length ? flight[0] : null;
// };

export async function checkAndSendAlerts() {
	//check if node env is production
	const isProduction = process.env.NODE_ENV === 'production';

	let activeAlerts;

	if (isProduction) {
		const activeAlertsList = await db
			.select()
			.from(alerts)
			.where(eq(alerts.isActive, true));

		activeAlerts = await Promise.all(
			activeAlertsList.map(async (alert) => ({
				...alert,
				notifications: await db
					.select()
					.from(alertNotifications)
					.where(
						and(
							eq(alertNotifications.alertId, alert.id),
							eq(alertNotifications.userId, alert.userId)
						)
					)
					.orderBy(alertNotifications.sentAt),
			}))
		);
	} else {
		const activeAlertsList = await db
			.select()
			.from(alerts)
			.where(
				and(eq(alerts.isActive, true), eq(alerts.username, 'p6mvp'))
			)
			.limit(10);

		activeAlerts = await Promise.all(
			activeAlertsList.map(async (alert) => ({
				...alert,
				notifications: await db
					.select()
					.from(alertNotifications)
					.where(
						and(
							eq(alertNotifications.alertId, alert.id),
							eq(alertNotifications.userId, alert.userId)
						)
					)
					.orderBy(alertNotifications.sentAt),
			}))
		);
	}

	// console.log('activeAlerts with all notifications:', {
	// 	totalAlerts: activeAlerts.length,
	// 	alerts: activeAlerts.map((alert) => ({
	// 		...alert,
	// 		notificationCount: alert.notifications.length,
	// 		lastNotification:
	// 			alert.notifications[alert.notifications.length - 1],
	// 	})),
	// });

	// // Add a summary of total notifications
	// const totalNotifications = activeAlerts.reduce(
	// 	(sum, alert) => sum + alert.notifications.length,
	// 	0
	// );

	// console.log('Summary:', {
	// 	totalAlerts: activeAlerts.length,
	// 	totalNotifications,
	// 	averageNotificationsPerAlert: (
	// 		totalNotifications / activeAlerts.length
	// 	).toFixed(2),
	// });

	// now loop through each alert and check for status changes
	activeAlerts.forEach(async (alert) => {
		// const userId = alert.userId;
		const chatId = alert.chatId;
		const flightNo = alert.flightNo;
		const date = alert.date;
		const alert_id = alert.id;

		// Check for status changes
		// if (alert.notifications.length > 0) {
		// 	//loop through notifications
		// 	alert.notifications.forEach(
		// 		(notification, indexNotification) => {
		// 			console.log(
		// 				`notification ${indexNotification + 1} of ${
		// 					alert.notifications.length
		// 				} for alert ${alert_id}`
		//       );

		//       const status = notification.status;

		// 			//if status contains 'reminder' then skip
		//       if (status?.includes('reminder')) {

		//       }
		// 		}
		// 	);
		// }

		//get current flight status
		const flightArrivals = await db
			.select()
			.from(arrivals)
			.where(
				and(
					eq(arrivals.flightNo, flightNo),
					eq(arrivals.date, date),
					//if estimated is not null
					isNotNull(arrivals.estimated)
				)
			)
			// .orderBy(arrivals.estimated);
			.limit(1);

		//now check if there are any departures for this flight and date
		const flightDepartures = await db
			.select()
			.from(departures)
			.where(
				and(
					eq(departures.flightNo, flightNo),
					eq(departures.date, date)
				)
			)
			.limit(1);

		if (!flightArrivals.length && !flightDepartures.length) {
			console.log(
				'No flight arrivals or departures found for this alert'
			);
			// continue to next alert
			return;
		}

		// send alert 30 minutes before estimated time for arrivals
		if (flightArrivals.length) {
			if (flightArrivals[0].estimated) {
				const estimatedTime = parseTime(flightArrivals[0].estimated);
				const now = new Date();
				const timeDiff = estimatedTime.getTime() - now.getTime();
				const minutesDiff = Math.floor(timeDiff / (1000 * 60)); // means minutes before arrival

				//if flight arrives at 1:30 alert should be tried before 1:00 (since this is run every 2 minutes)
				if (minutesDiff <= 33 && minutesDiff > 0) {
					console.log(
						'Sending arrival alert 30 minutes before estimated time'
					);

					//send message and record notification for this alert if not already sent
					const alreadyNotified = await hasNotificationBeenSent(
						alert_id,
						flightNo,
						date,
						'arrival_reminder_30'
					);

					if (!alreadyNotified) {
						await sendTelegramMessage(
							chatId,
							`⏰ Reminder: Flight ${flightNo} is scheduled to arrive in 30 minutes! \n\nGate: ${
								flightArrivals[0].gate || 'TBA'
							} at ${flightArrivals[0].estimated}`
						);

						await recordNotification(
							alert_id,
							flightNo,
							date,
							'arrival_reminder_30'
						);
					}
				}
			}

			//if any status change
			if (flightArrivals[0].status) {
				//send message and record notification for this alert if not already sent
				const alreadyNotified = await hasNotificationBeenSent(
					alert_id,
					flightNo,
					date,
					flightArrivals[0].status
				);

				if (!alreadyNotified) {
					await sendTelegramMessage(
						chatId,
						`🔔 Flight ${flightNo} Status Update:\n${getStatusMessage(
							flightArrivals[0].status
						)}\n\nGate: ${flightArrivals[0].gate || 'TBA'}`
					);

					await recordNotification(
						alert_id,
						flightNo,
						date,
						flightArrivals[0].status
					);
				}
			}
		}

		/*
		 * DEPARTURES
		 */
		//For this date, and estimated more than 1 hour ago + 30 minutes where carrierType is 'D' meaning Domestic (Gate closes 1 hour before, so alert should be sent 1.5 hours before)
		// For this date, and estimated more than 2 hour ago + 30 minutes where carrierType is 'I' meaning International (Gate closes 2 hours before, so alert should be sent 2.5 hours before)

		if (flightDepartures.length && flightDepartures[0].estimated) {
			// const estimatedTime = parseTime(flightDepartures[0].estimated);
			// const now = new Date();
			// const timeDiff = estimatedTime.getTime() - now.getTime();
			// const minutesDiff = Math.floor(timeDiff / (1000 * 60));

			//international flights
			if (flightDepartures[0].carrierType === 'I') {
			}
		}

		//deactivate alert if flight stat
	});

	return;

	// for (const alert of activeAlerts) {
	// 	const flight = await db
	// 		.select()
	// 		.from(arrivals)
	// 		.where(
	// 			and(
	// 				eq(arrivals.flightNo, alert.alert.flightNo),
	// 				eq(arrivals.date, alert.alert.date)
	// 			)
	// 		)
	// 		.union(
	// 			db
	// 				.select()
	// 				.from(departures)
	// 				.where(
	// 					and(
	// 						eq(departures.flightNo, alert.alert.flightNo),
	// 						eq(departures.date, alert.alert.date)
	// 					)
	// 				)
	// 		);

	// 	if (!flight.length) continue;
	// 	const currentFlight = flight[0];

	// 	// Check for status changes
	// 	if (currentFlight.status) {
	// 		// Check if this specific status has been sent to this user
	// 		const alreadyNotified = await hasNotificationBeenSent(
	// 			alert.alert.id, // This includes userId in the composite key
	// 			alert.alert.flightNo,
	// 			alert.alert.date,
	// 			currentFlight.status
	// 		);

	// 		console.log('Status notification check:', {
	// 			alertId: alert.alert.id,
	// 			userId: alert.alert.userId,
	// 			flightNo: alert.alert.flightNo,
	// 			currentStatus: currentFlight.status,
	// 			alreadyNotified,
	// 		});

	// 		if (!alreadyNotified) {
	// 			const statusMessage = getStatusMessage(currentFlight.status);
	// 			await sendTelegramMessage(
	// 				alert.alert.chatId,
	// 				`🔔 Flight ${
	// 					alert.alert.flightNo
	// 				} Status Update:\n${statusMessage}\n\nGate: ${
	// 					currentFlight.gate || 'TBA'
	// 				}`
	// 			);

	// 			// Record this notification for this specific user
	// 			await recordNotification(
	// 				alert.alert.id, // Contains userId
	// 				alert.alert.flightNo,
	// 				alert.alert.date,
	// 				currentFlight.status
	// 			);
	// 		}
	// 	}

	// 	// Check for estimated time and arrival time
	// 	if (currentFlight.estimated) {
	// 		const estimatedTime = parseTime(currentFlight.estimated);
	// 		const now = new Date();
	// 		const timeDiff = estimatedTime.getTime() - now.getTime();
	// 		const minutesDiff = Math.floor(timeDiff / (1000 * 60));

	// 		// Different notification types based on time
	// 		const notificationTypes = [
	// 			{ minutes: 60, type: 'reminder_60' },
	// 			{ minutes: 30, type: 'reminder_30' },
	// 			{ minutes: 15, type: 'reminder_15' },
	// 		];

	// 		const ltMinutes = 5;

	// 		for (const { minutes, type } of notificationTypes) {
	// 			if (
	// 				minutesDiff <= minutes &&
	// 				minutesDiff > minutes - ltMinutes
	// 			) {
	// 				const alreadyNotified = await hasNotificationBeenSent(
	// 					alert.alert.id,
	// 					alert.alert.flightNo,
	// 					alert.alert.date,
	// 					type
	// 				);

	// 				console.log('alreadyNotified', [
	// 					minutes,
	// 					type,
	// 					alreadyNotified,
	// 				]);

	// 				if (!alreadyNotified) {
	// 					await sendTelegramMessage(
	// 						alert.alert.chatId,
	// 						`⏰ Reminder: Flight ${
	// 							alert.alert.flightNo
	// 						} is scheduled in ${minutes} minutes!\n\nGate: ${
	// 							currentFlight.gate || 'TBA'
	// 						}`
	// 					);
	// 					await recordNotification(
	// 						alert.alert.id,
	// 						alert.alert.flightNo,
	// 						alert.alert.date,
	// 						type
	// 					);
	// 				}
	// 			}
	// 		}
	// 	}
	// }
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
