ALTER TABLE "alert_notifications" ALTER COLUMN "sent_at" SET DEFAULT timezone('Indian/Maldives', CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE "alerts" ALTER COLUMN "created_at" SET DEFAULT timezone('Indian/Maldives', CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE "arrivals" ALTER COLUMN "last_updated" SET DEFAULT timezone('Indian/Maldives', CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE "departures" ALTER COLUMN "last_updated" SET DEFAULT timezone('Indian/Maldives', CURRENT_TIMESTAMP);