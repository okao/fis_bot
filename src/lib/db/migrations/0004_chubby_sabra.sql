ALTER TABLE "alerts" ADD COLUMN "chat_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "username" varchar(100);--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "first_name" varchar(100);