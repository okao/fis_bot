import { DOMParser } from '@xmldom/xmldom';

interface FlightData {
	airlineId: string;
	airlineName: string;
	flightNo: string;
	route1: string;
	route2: string | null;
	route3: string | null;
	route4: string | null;
	route5: string | null;
	route6: string | null;
	scheduled: string | null;
	estimated: string | null;
	status: string | null;
	gate: string | null;
	terminal: string | null;
	checkinArea: string | null;
	date: string;
	primaryFlight: string | null;
	carrierType: string | null;
}

export async function fetchFlightData(
	type: 'arrivals' | 'departures'
): Promise<FlightData[]> {
	const url =
		type === 'arrivals'
			? 'https://fis.com.mv/xml/arrive.xml'
			: 'https://fis.com.mv/xml/depart.xml';

	try {
		const response = await fetch(url);
		const text = await response.text();

		// Parse XML
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(text, 'text/xml');
		const flightNodes = xmlDoc.getElementsByTagName('Flight');

		return Array.from(flightNodes)
			.map((flightNode): FlightData | null => {
				try {
					const getNodeText = (tagName: string): string | null => {
						const node = flightNode.getElementsByTagName(tagName)[0];
						const text = node?.textContent?.trim() || null;
						return text === '' ? null : text;
					};

					return {
						airlineId: getNodeText('AirLineID') || '',
						airlineName: getNodeText('AirLineName') || '',
						flightNo: getNodeText('FlightID') || '',
						route1: getNodeText('Route1') || '',
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
						date: getNodeText('Date') || '',
						primaryFlight: getNodeText('PrimaryFlight'),
						carrierType: getNodeText('CarrierType'),
					};
				} catch (error) {
					console.error('Error parsing flight node:', error);
					return null;
				}
			})
			.filter(
				(flight): flight is FlightData =>
					flight !== null &&
					flight.flightNo !== '' &&
					flight.airlineName !== ''
			);
	} catch (error) {
		console.error(`Error fetching ${type} data:`, error);
		throw error;
	}
}
