ALTER TABLE "arrivals" ALTER COLUMN "last_updated" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "arrivals" ALTER COLUMN "last_updated" SET DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Male';--> statement-breakpoint
ALTER TABLE "arrivals" ALTER COLUMN "last_updated" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "departures" ALTER COLUMN "last_updated" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "departures" ALTER COLUMN "last_updated" SET DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Male';--> statement-breakpoint
ALTER TABLE "departures" ALTER COLUMN "last_updated" SET NOT NULL;