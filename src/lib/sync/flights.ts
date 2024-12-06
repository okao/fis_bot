import { db } from '@/lib/db';
import { flights, arrivals, departures } from '@/lib/db/schema';
import { DOMParser } from '@xmldom/xmldom';

async function fetchAndParse(url: string) {
	const response = await fetch(url);
	const text = await response.text();

	// Parse XML
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(text, 'text/xml');
	const flightNodes = xmlDoc.getElementsByTagName('Flight');

	return Array.from(flightNodes)
		.map((flightNode) => {
			try {
				const getNodeText = (tagName: string) => {
					const node = flightNode.getElementsByTagName(tagName)[0];
					return node?.textContent?.trim() || '';
				};

				return {
					airlineId: getNodeText('AirLineID'),
					airlineName: getNodeText('AirLineName'),
					flightNo: getNodeText('FlightID'),
					route1: getNodeText('Route1'),
					route2: getNodeText('Route2'),
					route3: getNodeText('Route3'),
					route4: getNodeText('Route4'),
					route5: getNodeText('Route5'),
					route6: getNodeText('Route6'),
					scheduled: getNodeText('Scheduled'),
					estimated: getNodeText('Estimated'),
					status: getNodeText('Status'),
					gate: getNodeText('Gate'),
					terminal: getNodeText('Terminal'),
					checkinArea: getNodeText('CheckinArea'),
					date: getNodeText('Date'),
					primaryFlight: getNodeText('PrimaryFlight'),
					carrierType: getNodeText('CarrierType'),
				};
			} catch (error) {
				console.error('Error parsing flight:', error);
				return null;
			}
		})
		.filter(
			(flight): flight is NonNullable<typeof flight> =>
				flight !== null
		);
}

export async function syncFlights() {
	try {
		const arrivalFlights = await fetchAndParse(
			'https://fis.com.mv/xml/arrive.xml'
		);
		const departureFlights = await fetchAndParse(
			'https://fis.com.mv/xml/depart.xml'
		);

		// Process arrivals
		for (const flight of arrivalFlights) {
			if (!flight.flightNo || !flight.airlineName) {
				console.log('Missing required fields:', flight);
				continue;
			}

			await db
				.insert(flights)
				.values([
					{
						id: flight.flightNo,
						airline: flight.airlineName,
						flightNo: flight.flightNo,
					},
				])
				.onConflictDoNothing();

			await db
				.insert(arrivals)
				.values({
					id: `${flight.airlineId}_${flight.flightNo}_${flight.date}`,
					flightId: flight.flightNo,
					airlineId: flight.airlineId,
					airlineName: flight.airlineName,
					flightNo: flight.flightNo,
					route1: flight.route1,
					route2: flight.route2,

					route3: flight.route3,
					route4: flight.route4,
					route5: flight.route5,
					route6: flight.route6,
					scheduled: flight.scheduled,
					estimated: flight.estimated,
					status: flight.status,
					gate: flight.gate,
					terminal: flight.terminal,
					checkinArea: flight.checkinArea,
					date: flight.date,
					primaryFlight: flight.primaryFlight,
					carrierType: flight.carrierType,
					lastUpdated: new Date(),
				})
				.onConflictDoUpdate({
					target: arrivals.id,
					set: {
						route1: flight.route1,
						route2: flight.route2,
						route3: flight.route3,
						route4: flight.route4,
						route5: flight.route5,
						route6: flight.route6,
						scheduled: flight.scheduled,
						estimated: flight.estimated,
						status: flight.status,
						gate: flight.gate,
						terminal: flight.terminal,
						checkinArea: flight.checkinArea,
						primaryFlight: flight.primaryFlight,
						carrierType: flight.carrierType,
						lastUpdated: new Date(),
					},
				});
		}

		// Process departures
		for (const flight of departureFlights) {
			if (!flight.flightNo || !flight.airlineName) {
				console.log('Missing required fields:', flight);
				continue;
			}

			await db
				.insert(flights)
				.values([
					{
						id: flight.flightNo,
						airline: flight.airlineName,
						flightNo: flight.flightNo,
					},
				])
				.onConflictDoNothing();

			await db
				.insert(departures)
				.values({
					id: `${flight.airlineId}_${flight.flightNo}_${flight.date}`,
					flightId: flight.flightNo,
					airlineId: flight.airlineId,
					airlineName: flight.airlineName,
					flightNo: flight.flightNo,
					route1: flight.route1,
					route2: flight.route2,
					route3: flight.route3,
					route4: flight.route4,
					route5: flight.route5,
					route6: flight.route6,
					scheduled: flight.scheduled,
					estimated: flight.estimated,
					status: flight.status,
					gate: flight.gate,
					terminal: flight.terminal,
					checkinArea: flight.checkinArea,
					date: flight.date,
					primaryFlight: flight.primaryFlight,
					carrierType: flight.carrierType,
					lastUpdated: new Date(),
				})
				.onConflictDoUpdate({
					target: departures.id,
					set: {
						route1: flight.route1,
						route2: flight.route2,
						route3: flight.route3,
						route4: flight.route4,
						route5: flight.route5,
						route6: flight.route6,
						scheduled: flight.scheduled,
						estimated: flight.estimated,
						status: flight.status,
						gate: flight.gate,
						terminal: flight.terminal,
						checkinArea: flight.checkinArea,
						primaryFlight: flight.primaryFlight,
						carrierType: flight.carrierType,
						lastUpdated: new Date(),
					},
				});
		}

		return { success: true };
	} catch (error) {
		console.error('Error syncing flights:', error);
		return { success: false, error };
	}
}
