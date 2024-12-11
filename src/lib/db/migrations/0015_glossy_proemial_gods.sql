ALTER TABLE "alert_notifications" DROP CONSTRAINT "alert_notifications_alert_id_alerts_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_notifications" ADD CONSTRAINT "alert_notifications_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
