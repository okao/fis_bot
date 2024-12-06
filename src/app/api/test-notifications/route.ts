import { NextResponse } from 'next/server';
import { checkAndSendAlerts } from '@/lib/notifications';
import { headers } from 'next/headers';

export async function POST() {
	try {
		const headersList = await headers();
		const authHeader = headersList.get('authorization');

		console.log('authHeader', authHeader);
		console.log('CRON_SECRET', `Bearer ${process.env.CRON_SECRET}`);

		// Verify cron secret to prevent unauthorized access
		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		await checkAndSendAlerts();

		return NextResponse.json({
			success: true,
			message: 'Notifications check triggered successfully',
		});
	} catch (error) {
		console.error('Manual notification check failed:', error);
		return NextResponse.json(
			{ error: 'Failed to check notifications' },
			{ status: 500 }
		);
	}
}
