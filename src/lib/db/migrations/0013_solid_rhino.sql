ALTER TABLE "alert_notifications" ADD COLUMN "type" varchar(20);--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "type" varchar(20);