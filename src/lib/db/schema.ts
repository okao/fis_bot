import { sql } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	varchar,
	boolean,
} from 'drizzle-orm/pg-core';

export const flights = pgTable('flights', {
	id: text('id').primaryKey(),
	airline: varchar('airline', { length: 100 }).notNull(),
	flightNo: varchar('flight_no', { length: 20 }).notNull(),
});

export const arrivals = pgTable('arrivals', {
	id: text('id').primaryKey(),
	flightId: text('flight_id')
		.references(() => flights.id)
		.notNull(),
	airlineId: varchar('airline_id', { length: 10 }).notNull(),
	airlineName: varchar('airline_name', { length: 100 }).notNull(),
	flightNo: varchar('flight_no', { length: 20 }).notNull(),
	route1: varchar('route1', { length: 100 }),
	route2: varchar('route2', { length: 100 }),
	route3: varchar('route3', { length: 100 }),
	route4: varchar('route4', { length: 100 }),
	route5: varchar('route5', { length: 100 }),
	route6: varchar('route6', { length: 100 }),
	scheduled: varchar('scheduled', { length: 5 }),
	estimated: varchar('estimated', { length: 5 }),
	status: varchar('status', { length: 2 }),
	gate: varchar('gate', { length: 10 }),
	terminal: varchar('terminal', { length: 10 }),
	checkinArea: varchar('checkin_area', { length: 20 }),
	date: varchar('date', { length: 8 }),
	primaryFlight: varchar('primary_flight', { length: 10 }),
	carrierType: varchar('carrier_type', { length: 1 }),
	lastUpdated: timestamp('last_updated', { withTimezone: true })
		.default(sql`timezone('Asia/Male', CURRENT_TIMESTAMP)`)
		.notNull(),
});

export const departures = pgTable('departures', {
	id: text('id').primaryKey(),
	flightId: text('flight_id')
		.references(() => flights.id)
		.notNull(),
	airlineId: varchar('airline_id', { length: 10 }).notNull(),
	airlineName: varchar('airline_name', { length: 100 }).notNull(),
	flightNo: varchar('flight_no', { length: 20 }).notNull(),
	route1: varchar('route1', { length: 100 }),
	route2: varchar('route2', { length: 100 }),
	route3: varchar('route3', { length: 100 }),
	route4: varchar('route4', { length: 100 }),
	route5: varchar('route5', { length: 100 }),
	route6: varchar('route6', { length: 100 }),
	scheduled: varchar('scheduled', { length: 5 }),
	estimated: varchar('estimated', { length: 5 }),
	status: varchar('status', { length: 2 }),
	gate: varchar('gate', { length: 10 }),
	terminal: varchar('terminal', { length: 10 }),
	checkinArea: varchar('checkin_area', { length: 20 }),
	date: varchar('date', { length: 8 }),
	primaryFlight: varchar('primary_flight', { length: 10 }),
	carrierType: varchar('carrier_type', { length: 1 }),
	lastUpdated: timestamp('last_updated', { withTimezone: true })
		.default(sql`timezone('Asia/Male', CURRENT_TIMESTAMP)`)
		.notNull(),
});

export const alerts = pgTable('alerts', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	chatId: text('chat_id').notNull(),
	username: varchar('username', { length: 100 }),
	firstName: varchar('first_name', { length: 100 }),
	flightNo: varchar('flight_no', { length: 20 }).notNull(),
	date: varchar('date', { length: 8 }).notNull(),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`timezone('Asia/Male', CURRENT_TIMESTAMP)`)
		.notNull(),
	lastNotified: timestamp('last_notified', { withTimezone: true }),
});

export const alertNotifications = pgTable('alert_notifications', {
	id: text('id').primaryKey(),
	alertId: text('alert_id')
		.references(() => alerts.id)
		.notNull(),
	flightNo: varchar('flight_no', { length: 20 }).notNull(),
	date: varchar('date', { length: 8 }).notNull(),
	status: varchar('status', { length: 2 }),
	sentAt: timestamp('sent_at', { withTimezone: true })
		.default(sql`timezone('Asia/Male', CURRENT_TIMESTAMP)`)
		.notNull(),
});
