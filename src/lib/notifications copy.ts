import { db } from '@/lib/db';
import { alerts, alertNotifications } from '@/lib/db/schema';
import { eq, and, notInArray, or, isNull } from 'drizzle-orm';
import { sendTelegramMessage } from './telegram';
import { searchFlightsReal } from './db/queries';

// const getCurrentFlight = async (
// 	flightNo: string,
// 	date: string
// ): Promise<Flight | null> => {

// 	return flight.length ? flight[0] : null;
// };

export async function checkAndSendAlerts() {
	//check if node env is production
	// const isProduction = process.env.NODE_ENV === 'production';

	// if (!isProduction) {
	// 	//stop execution
	// 	return;
	// }

	// let activeAlerts;

	// const notNeededStatuses = ['LA'];

	const activeAlertsList = await db
		.select()
		.from(alerts)
		.where(
			and(
				eq(alerts.isActive, true),
				or(
					isNull(alerts.flight_status),
					notInArray(alerts.flight_status, ['LA']) // explicitly list the statuses
				)
			)
		);

	const activeAlerts = await Promise.all(
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

	console.log('activeAlerts', activeAlerts);

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
		const type = alert.type;

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
		// const flightArrivals = await db
		// 	.select()
		// 	.from(arrivals)
		// 	.where(
		// 		and(
		// 			eq(arrivals.flightNo, flightNo),
		// 			eq(arrivals.date, date),
		// 			//if estimated is not null
		// 			isNotNull(arrivals.estimated)
		// 		)
		// 	)
		// 	// .orderBy(arrivals.estimated);
		// 	.limit(1);
		const flights = await searchFlightsReal(
			flightNo,
			date,
			undefined,
			'arrivals'
		);

		const flightsDepartures = await searchFlightsReal(
			flightNo,
			date,
			undefined,
			'departures'
		);

		if (type === 'arrival' && flights.arrivals.length) {
			const flightArrival = flights.arrivals[0];

			console.log('flightArrival', flightArrival);

			//if any status change
			if (flightArrival.status !== alert.flight_status) {
				console.log('Status changed:', flightArrival.status);

				//send message and record notification for this alert if not already sent
				const alreadyNotified = await hasNotificationBeenSent(
					alert_id,
					flightNo,
					date,
					flightArrival.status,
					'arrival'
				);

				if (!alreadyNotified) {
					await sendTelegramMessage(
						chatId,
						`🔔 Flight ${flightNo} Status Update:\n${getStatusMessage(
							flightArrival.status || ''
						)}`
					);

					await recordNotification(
						alert_id,
						flightNo,
						date,
						flightArrival.status,
						'arrival'
					);
				}
			}

			//if arrival and (estimated more than current time)
			if (
				flightArrival.estimated &&
				new Date(flightArrival.estimated) > new Date()
			) {
				console.log(
					'Estimated time is in the future:',
					flightArrival.estimated
				);

				//30 minutes before estimated time
				const estimatedTime = parseTime(flightArrival.estimated);
				const now = new Date();
				const timeDiff = estimatedTime.getTime() - now.getTime();
				const minutesDiff = Math.floor(timeDiff / (1000 * 60));

				console.log('minutesDiff', minutesDiff);

				//if 30 minutes or less
				if (minutesDiff <= 30) {
					console.log(
						'Sending arrival alert 30 minutes before estimated time'
					);

					//send message and record notification for this alert if not already sent
					const alreadyNotified = await hasNotificationBeenSent(
						alert_id,
						flightNo,
						date,
						'arrival',
						'arrival_reminder_30'
					);

					if (!alreadyNotified) {
						await sendTelegramMessage(
							chatId,
							`⏰ Reminder: Flight ${flightNo} is scheduled to arrive in 30 minutes! \n\nGate: ${
								flightArrival.gate || 'TBA'
							} at ${flightArrival.estimated}`
						);

						await recordNotification(
							alert_id,
							flightNo,
							date,
							'arrival',
							'arrival_reminder_30'
						);
					}
				}
			}
		}

		//for departures
		if (type === 'departure' && flightsDepartures.departures.length) {
			const flightDeparture = flightsDepartures.departures[0];

			console.log('flightDeparture', flightDeparture);

			if (flightDeparture.status !== alert.flight_status) {
				console.log('Status changed:', flightDeparture.status);

				//send message and record notification for this alert if not already sent
				const alreadyNotified = await hasNotificationBeenSent(
					alert_id,
					flightNo,
					date,
					flightDeparture.status,
					'departure'
				);

				if (!alreadyNotified) {
					await sendTelegramMessage(
						chatId,
						`🔔 Flight ${flightNo} Status Update:\n${getStatusMessage(
							flightDeparture.status || ''
						)}`
					);

					await recordNotification(
						alert_id,
						flightNo,
						date,
						flightDeparture.status,
						'departure'
					);
				}
			}

			const et =
				flightDeparture.estimated || flightDeparture.scheduled;

			//send all above alerts
			const estimatedTime = parseTime(et || '');

			// console.log('estimatedTime', estimatedTime);
			// console.log('check_time', [
			// 	new Date(estimatedTime),
			// 	new Date(),
			// ]);
			const nowTime = new Date();
			const estimatedTimeDate = new Date(estimatedTime);

			//minus 3 hours from nowTime
			nowTime.setHours(nowTime.getHours() - 3);

			console.log('nowTime', nowTime);
			console.log('estimatedTimeDate', estimatedTimeDate);

			//if departure and (estimated more than current time)
			if (estimatedTimeDate && estimatedTimeDate > nowTime) {
				console.log(
					'Estimated time is in the future:',
					flightDeparture.estimated
				);

				//if carrierType is 'I' meaning international
				if (flightDeparture.carrierType === 'I') {
					//4:15 hours before estimated time ['check-in will start in ${flightDeparture.estimated}']
					//3:15 hours before estimated time ['check-in will be closed in 1 hour and 10 minutes']
					//2:15 hours before estimated time ['check-in will be closed in 10 minutes']

					console.log('estimatedTime', estimatedTime);

					const now = new Date();
					const timeDiff =
						estimatedTimeDate.getTime() - now.getTime();
					const minutesDiff = Math.floor(timeDiff / (1000 * 60));

					//checki-in time (add estimatedTime + 3 hours)
					const checkInTime = new Date(
						estimatedTimeDate.getTime() + 3 * 60 * 60 * 1000
					);
					//check-in close time (add estimatedTime + 2 hours)
					const checkInCloseTime = new Date(
						estimatedTimeDate.getTime() + 2 * 60 * 60 * 1000
					);

					console.log('minutesDiff', minutesDiff);

					//if between 4:15 hours and 3:15 hours
					if (minutesDiff <= 270 && minutesDiff > 195) {
						console.log(
							'Sending departure alert 4:15 hours before estimated time'
						);

						//send message and record notification for this alert if not already sent
						const alreadyNotified = await hasNotificationBeenSent(
							alert_id,
							flightNo,
							date,
							'departure',
							'departure_reminder_270'
						);

						if (!alreadyNotified) {
							await sendTelegramMessage(
								chatId,
								`⏰ Reminder: Flight ${flightNo} check-in will start in ${checkInTime.toLocaleString()}`
							);

							await recordNotification(
								alert_id,
								flightNo,
								date,
								'departure',
								'departure_reminder_270'
							);
						}
					}

					//if between 3:15 hours and 2:15 hours
					if (minutesDiff <= 195 && minutesDiff > 120) {
						console.log(
							'Sending departure alert 3:15 hours before estimated time'
						);

						//send message and record notification for this alert if not already sent
						const alreadyNotified = await hasNotificationBeenSent(
							alert_id,
							flightNo,
							date,
							'departure',
							'departure_reminder_195'
						);

						if (!alreadyNotified) {
							await sendTelegramMessage(
								chatId,
								`⏰ Reminder: Flight ${flightNo} check-in will be closed in ${checkInCloseTime.toLocaleString()}`
							);

							await recordNotification(
								alert_id,
								flightNo,
								date,
								'departure',
								'departure_reminder_195'
							);
						}
					}

					//if between 2:15 hours and 1:15 hours
					if (minutesDiff <= 120 && minutesDiff > 60) {
						console.log(
							'Sending departure alert 2:15 hours before estimated time'
						);

						//send message and record notification for this alert if not already sent
						const alreadyNotified = await hasNotificationBeenSent(
							alert_id,
							flightNo,
							date,
							'departure',
							'departure_reminder_120'
						);

						if (!alreadyNotified) {
							await sendTelegramMessage(
								chatId,
								`⏰ Reminder: Flight ${flightNo} check-in will be closed in ${checkInCloseTime.toLocaleString()}`
							);

							await recordNotification(
								alert_id,
								flightNo,
								date,
								'departure',
								'departure_reminder_120'
							);
						}
					}
				}
			}
		}

		//now check if there are any departures for this flight and date
		// const flightDepartures = await db
		// 	.select()
		// 	.from(departures)
		// 	.where(
		// 		and(
		// 			eq(departures.flightNo, flightNo),
		// 			eq(departures.date, date)
		// 		)
		// 	)
		// 	.limit(1);

		// console.log('flightDepartures', flightDepartures);

		// if (!flightArrivals.length && !flightDepartures.length) {
		// 	console.log(
		// 		'No flight arrivals or departures found for this alert'
		// 	);
		// 	// continue to next alert
		// 	return;
		// }

		// // send alert 30 minutes before estimated time for arrivals
		// if (flightArrivals.length) {
		// 	//check estimated is greater than current time
		// 	if (
		// 		flightArrivals[0].estimated &&
		// 		new Date(flightArrivals[0].estimated) > new Date()
		// 	) {
		// 		const estimatedTime = parseTime(flightArrivals[0].estimated);
		// 		const now = new Date();
		// 		const timeDiff = estimatedTime.getTime() - now.getTime();
		// 		const minutesDiff = Math.floor(timeDiff / (1000 * 60)); // means minutes before arrival

		// 		console.log('minutesDiff', minutesDiff);

		// 		return;

		// 		//if flight arrives at 1:30 alert should be tried before 1:00 (since this is run every 2 minutes)
		// 		if (minutesDiff <= 33 && minutesDiff > 0) {
		// 			console.log(
		// 				'Sending arrival alert 30 minutes before estimated time'
		// 			);

		// 			//send message and record notification for this alert if not already sent
		// 			const alreadyNotified = await hasNotificationBeenSent(
		// 				alert_id,
		// 				flightNo,
		// 				date,
		// 				'arrival',
		// 				'arrival_reminder_30'
		// 			);

		// 			if (!alreadyNotified) {
		// 				await sendTelegramMessage(
		// 					chatId,
		// 					`⏰ Reminder: Flight ${flightNo} is scheduled to arrive in 30 minutes! \n\nGate: ${
		// 						flightArrivals[0].gate || 'TBA'
		// 					} at ${flightArrivals[0].estimated}`
		// 				);

		// 				await recordNotification(
		// 					alert_id,
		// 					flightNo,
		// 					date,
		// 					'arrival',
		// 					'arrival_reminder_30'
		// 				);
		// 			}
		// 		}
		// 	}

		// 	//if any status change
		// 	if (flightArrivals[0].status) {
		// 		//send message and record notification for this alert if not already sent
		// 		const alreadyNotified = await hasNotificationBeenSent(
		// 			alert_id,
		// 			flightNo,
		// 			date,
		// 			flightArrivals[0].status,
		// 			'arrival'
		// 		);

		// 		if (!alreadyNotified) {
		// 			await sendTelegramMessage(
		// 				chatId,
		// 				`🔔 Flight ${flightNo} Status Update:\n${getStatusMessage(
		// 					flightArrivals[0].status
		// 				)}\n\nGate: ${flightArrivals[0].gate || 'TBA'}`
		// 			);

		// 			await recordNotification(
		// 				alert_id,
		// 				flightNo,
		// 				date,
		// 				flightArrivals[0].status,
		// 				'arrival'
		// 			);
		// 		}
		// 	}
		// }

		/*
		 * DEPARTURES
		 */
		//For this date, and estimated more than 1 hour ago + 30 minutes where carrierType is 'D' meaning Domestic (Gate closes 1 hour before, so alert should be sent 1.5 hours before)
		// For this date, and estimated more than 2 hour ago + 30 minutes where carrierType is 'I' meaning International (Gate closes 2 hours before, so alert should be sent 2.5 hours before)

		// if (flightDepartures.length && flightDepartures[0].estimated) {
		// 	// const estimatedTime = parseTime(flightDepartures[0].estimated);
		// 	// const now = new Date();
		// 	// const timeDiff = estimatedTime.getTime() - now.getTime();
		// 	// const minutesDiff = Math.floor(timeDiff / (1000 * 60));

		// 	//international flights
		// 	if (flightDepartures[0].carrierType === 'I') {
		// 	}
		// }

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

// Parse time string to Date object with Maldives timezone (+5)
function parseTime(timeString: string): Date {
	const [hours, minutes] = timeString.split(':').map(Number);
	const date = new Date();

	// Create date string in Maldives timezone
	const maldivesDate = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Indian/Maldives',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);

	// Combine date and time
	return new Date(
		`${maldivesDate} ${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}:00 +0500`
	);
}

async function hasNotificationBeenSent(
	alertId: string,
	flightNo: string,
	date: string,
	status: string | null,
	type: string
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
				eq(alertNotifications.status, status || ''),
				eq(alertNotifications.type, type)
			)
		)
		.limit(1);

	return existing.length > 0;
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

	console.log('Recording notification:', {
		alertId,
		userId: alert[0].userId,
		chatId: alert[0].chatId,
		flightNo,
		date,
		status,
	});

	// Wrap both operations in a transaction
	await db.transaction(async (tx) => {
		await tx.insert(alertNotifications).values({
			id: `${alertId}_${status || 'reminder'}_${
				alert[0].userId
			}_${Date.now()}`,
			alertId,
			userId: alert[0].userId,
			chatId: alert[0].chatId,
			flightNo,
			date,
			status,
			type,
		});

		await tx
			.update(alerts)
			.set({
				lastNotified: new Date(),
				flight_status: status || '',
				// isActive: false,
			})
			.where(eq(alerts.id, alertId));
	});

	return true;
}
