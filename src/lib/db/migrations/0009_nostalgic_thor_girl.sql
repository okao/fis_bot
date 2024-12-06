CREATE TABLE IF NOT EXISTS "alert_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"alert_id" text NOT NULL,
	"flight_no" varchar(20) NOT NULL,
	"date" varchar(8) NOT NULL,
	"status" varchar(2),
	"sent_at" timestamp with time zone DEFAULT timezone('Asia/Male', CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ALTER COLUMN "created_at" SET DEFAULT timezone('Asia/Male', CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE "arrivals" ALTER COLUMN "last_updated" SET DEFAULT timezone('Asia/Male', CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE "departures" ALTER COLUMN "last_updated" SET DEFAULT timezone('Asia/Male', CURRENT_TIMESTAMP);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_notifications" ADD CONSTRAINT "alert_notifications_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
