import {
	pgTable,
	text,
	timestamp,
	boolean,
	jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	platform: text('platform').notNull().default('telegram'),
	username: text('username'),
	first_name: text('first_name'),
	last_name: text('last_name'),
	chat_id: text('chat_id'),
	created_at: timestamp('created_at').defaultNow().notNull(),
	last_seen: timestamp('last_seen').defaultNow(),
	is_active: boolean('is_active').default(true).notNull(),
	preferences: jsonb('preferences').default({}).notNull(),
});

export const alerts = pgTable('alerts', {
	id: text('id').primaryKey(),
	user_id: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	chat_id: text('chat_id').notNull(),
	username: text('username'),
	firstName: text('first_name'),
	flight_no: text('flight_no').notNull(),
	date: text('date').notNull(),
	type: text('type'),
	flight_status: text('flight_status'),
	is_active: boolean('is_active').default(true).notNull(),
	created_at: timestamp('created_at').defaultNow().notNull(),
	last_notified: timestamp('last_notified'),
});

export const alertNotifications = pgTable('alert_notifications', {
	id: text('id').primaryKey(),
	alert_id: text('alert_id')
		.references(() => alerts.id, { onDelete: 'cascade' })
		.notNull(),
	user_id: text('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	chat_id: text('chat_id').notNull(),
	flight_no: text('flight_no').notNull(),
	type: text('type'),
	date: text('date').notNull(),
	status: text('status'),
	sent_at: timestamp('sent_at').defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferInsert;
