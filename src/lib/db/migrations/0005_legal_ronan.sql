ALTER TABLE "alerts" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "alerts" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Male';--> statement-breakpoint
ALTER TABLE "alerts" ALTER COLUMN "last_notified" SET DATA TYPE timestamp with time zone;