CREATE TABLE IF NOT EXISTS "flights" (
	"id" text PRIMARY KEY NOT NULL,
	"flight_no" varchar(10) NOT NULL,
	"airline" varchar(100) NOT NULL,
	"origin" varchar(100) NOT NULL,
	"destination" varchar(100) NOT NULL,
	"scheduled_time" timestamp NOT NULL,
	"actual_time" timestamp,
	"is_arrival" boolean NOT NULL,
	"date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled'
);
