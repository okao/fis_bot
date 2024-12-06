CREATE TABLE IF NOT EXISTS "arrivals" (
	"id" text PRIMARY KEY NOT NULL,
	"flight_id" text NOT NULL,
	"airline_id" varchar(10) NOT NULL,
	"airline_name" varchar(100) NOT NULL,
	"flight_no" varchar(20) NOT NULL,
	"route1" varchar(100),
	"route2" varchar(100),
	"route3" varchar(100),
	"route4" varchar(100),
	"route5" varchar(100),
	"route6" varchar(100),
	"scheduled" varchar(5),
	"estimated" varchar(5),
	"status" varchar(2),
	"gate" varchar(10),
	"terminal" varchar(10),
	"checkin_area" varchar(20),
	"date" varchar(8),
	"primary_flight" varchar(10),
	"carrier_type" varchar(1),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departures" (
	"id" text PRIMARY KEY NOT NULL,
	"flight_id" text NOT NULL,
	"airline_id" varchar(10) NOT NULL,
	"airline_name" varchar(100) NOT NULL,
	"flight_no" varchar(20) NOT NULL,
	"route1" varchar(100),
	"route2" varchar(100),
	"route3" varchar(100),
	"route4" varchar(100),
	"route5" varchar(100),
	"route6" varchar(100),
	"scheduled" varchar(5),
	"estimated" varchar(5),
	"status" varchar(2),
	"gate" varchar(10),
	"terminal" varchar(10),
	"checkin_area" varchar(20),
	"date" varchar(8),
	"primary_flight" varchar(10),
	"carrier_type" varchar(1),
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arrivals" ADD CONSTRAINT "arrivals_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "departures" ADD CONSTRAINT "departures_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "flights" DROP COLUMN IF EXISTS "origin";--> statement-breakpoint
ALTER TABLE "flights" DROP COLUMN IF EXISTS "destination";--> statement-breakpoint
ALTER TABLE "flights" DROP COLUMN IF EXISTS "scheduled_time";--> statement-breakpoint
ALTER TABLE "flights" DROP COLUMN IF EXISTS "actual_time";--> statement-breakpoint
ALTER TABLE "flights" DROP COLUMN IF EXISTS "is_arrival";--> statement-breakpoint
ALTER TABLE "flights" DROP COLUMN IF EXISTS "date";--> statement-breakpoint
ALTER TABLE "flights" DROP COLUMN IF EXISTS "status";