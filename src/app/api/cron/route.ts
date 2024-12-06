import { NextResponse } from 'next/server';
import { syncFlights } from '@/lib/sync/flights';
import { headers } from 'next/headers';

export const maxDuration = 300; // 5 minutes

export async function GET() {
	const headersList = await headers();
	const authHeader = headersList.get('authorization');

	console.log('authHeader', authHeader);
	console.log('CRON_SECRET', `Bearer ${process.env.CRON_SECRET}`);

	// Verify cron secret to prevent unauthorized access
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new NextResponse('Unauthorized', { status: 401 });
	}

	try {
		const result = await syncFlights();
		return NextResponse.json(result);
	} catch (error) {
		console.error('Cron job failed:', error);
		return NextResponse.json(
			{ error: 'Sync failed' },
			{ status: 500 }
		);
	}
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
