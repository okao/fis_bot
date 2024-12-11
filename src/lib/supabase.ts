import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		persistSession: false,
	},
});

// Database types
export type Alert = {
	id: string;
	user_id: string;
	chat_id: string;
	username?: string;
	first_name?: string;
	flight_no: string;
	date: string;
	type?: string;
	flight_status?: string;
	is_active: boolean;
	created_at: string;
	last_notified?: string;
};

export type AlertNotification = {
	id: string;
	alert_id: string;
	user_id: string;
	chat_id: string;
	flight_no: string;
	type?: string;
	date: string;
	status?: string;
	sent_at: string;
};
