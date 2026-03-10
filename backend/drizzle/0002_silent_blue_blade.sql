DELETE FROM "appointments";--> statement-breakpoint
DELETE FROM "services";--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "barber_profile_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_barber_profile_id_barber_profile_id_fk" FOREIGN KEY ("barber_profile_id") REFERENCES "public"."barber_profile"("id") ON DELETE cascade ON UPDATE no action;