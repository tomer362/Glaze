CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "glaze_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"code" text,
	"hex" text,
	"image_url" text,
	"is_base" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixture_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mixture_id" uuid NOT NULL,
	"glaze_color_id" uuid NOT NULL,
	"amount" real,
	"unit" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixtures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"result_image_url" text,
	"result_hex" text,
	"has_amounts" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glaze_colors" ADD CONSTRAINT "glaze_colors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixture_components" ADD CONSTRAINT "mixture_components_mixture_id_mixtures_id_fk" FOREIGN KEY ("mixture_id") REFERENCES "public"."mixtures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixture_components" ADD CONSTRAINT "mixture_components_glaze_color_id_glaze_colors_id_fk" FOREIGN KEY ("glaze_color_id") REFERENCES "public"."glaze_colors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixtures" ADD CONSTRAINT "mixtures_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "glaze_brand_name_uq" ON "glaze_colors" USING btree ("brand","name");--> statement-breakpoint
CREATE INDEX "glaze_name_idx" ON "glaze_colors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "mc_color_idx" ON "mixture_components" USING btree ("glaze_color_id");--> statement-breakpoint
CREATE INDEX "mc_mixture_idx" ON "mixture_components" USING btree ("mixture_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mc_unique_pair" ON "mixture_components" USING btree ("mixture_id","glaze_color_id");--> statement-breakpoint
CREATE INDEX "mix_created_by_idx" ON "mixtures" USING btree ("created_by");