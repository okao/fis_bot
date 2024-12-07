import { NextResponse } from 'next/server';
import { searchFlights } from '@/lib/db/queries';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get('q') || '';
	const date = searchParams.get('date');
	const userId = searchParams.get('userId');

	console.log('Search API called with:', {
		query,
		date,
		userId,
	});

	try {
		const flights = await searchFlights(
			query,
			date || undefined,
			userId || undefined
		);
		return NextResponse.json(flights);
	} catch (error) {
		console.error('Search failed:', error);
		return NextResponse.json(
			{ error: 'Search failed' },
			{ status: 500 }
		);
	}
}
