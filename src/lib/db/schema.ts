import {
	pgTable,
	text,
	timestamp,
	varchar,
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
	lastUpdated: timestamp('last_updated').defaultNow(),
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
	lastUpdated: timestamp('last_updated').defaultNow(),
});
