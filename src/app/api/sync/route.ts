import { NextResponse } from 'next/server';
import { syncFlights } from '@/lib/sync/flights';

export async function GET() {
	try {
		const result = await syncFlights();
		return NextResponse.json(result);
	} catch (error) {
		console.error('Manual sync failed:', error);
		return NextResponse.json(
			{ error: 'Sync failed' },
			{ status: 500 }
		);
	}
}
