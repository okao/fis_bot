CREATE TABLE IF NOT EXISTS "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"flight_no" varchar(20) NOT NULL,
	"date" varchar(8) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_notified" timestamp
);
