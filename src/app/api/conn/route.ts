import { db } from '@/lib/supabase/db';
import { users } from '@/lib/supabase/schema';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes

export async function GET() {
	try {
		const result = await db.select().from(users).limit(1);

		return NextResponse.json(result);
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch users' },
			{ status: 500 }
		);
	}
}
