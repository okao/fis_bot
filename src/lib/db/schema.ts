import { sql } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	varchar,
	boolean,
} from 'drizzle-orm/pg-core';

export const alerts = pgTable('alerts', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	chatId: text('chat_id').notNull(),
	username: varchar('username', { length: 100 }),
	firstName: varchar('first_name', { length: 100 }),
	flightNo: varchar('flight_no', { length: 20 }).notNull(),
	date: varchar('date', { length: 8 }).notNull(),
	type: varchar('type', { length: 20 }),
	flight_status: varchar('flight_status', { length: 20 }),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`timezone('Indian/Maldives', CURRENT_TIMESTAMP)`)
		.notNull(),
	lastNotified: timestamp('last_notified', { withTimezone: true }),
});

export const alertNotifications = pgTable('alert_notifications', {
	id: text('id').primaryKey(),
	alertId: text('alert_id')
		.references(() => alerts.id, { onDelete: 'cascade' })
		.notNull(),
	userId: text('user_id').notNull(),
	chatId: text('chat_id').notNull(),
	flightNo: varchar('flight_no', { length: 20 }).notNull(),
	type: varchar('type', { length: 20 }),
	date: varchar('date', { length: 8 }).notNull(),
	status: varchar('status', { length: 20 }),
	sentAt: timestamp('sent_at', { withTimezone: true })
		.default(sql`timezone('Indian/Maldives', CURRENT_TIMESTAMP)`)
		.notNull(),
});
