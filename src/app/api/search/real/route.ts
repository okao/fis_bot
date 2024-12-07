import { NextResponse } from 'next/server';
import { searchFlightsReal } from '@/lib/db/queries';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get('q') || '';
	const date = searchParams.get('date');
	const userId = searchParams.get('userId');
	const type = searchParams.get('type') as
		| 'arrivals'
		| 'departures'
		| null;

	console.log('Real-time Search API called with:', {
		query,
		date,
		userId,
		type,
	});

	try {
		const flights = await searchFlightsReal(
			query,
			date || undefined,
			userId || undefined,
			type || undefined
		);
		return new NextResponse(JSON.stringify(flights), {
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
			},
		});
	} catch (error) {
		console.error('Real-time search failed:', error);
		return NextResponse.json(
			{ error: 'Search failed' },
			{ status: 500 }
		);
	}
}
