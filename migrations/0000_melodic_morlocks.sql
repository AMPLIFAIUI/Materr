CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"specialist_id" integer NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crisis_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"country" text NOT NULL,
	"region" text,
	"service_type" text NOT NULL,
	"is_available_24h" boolean DEFAULT false NOT NULL,
	"operating_hours" text,
	"description" text NOT NULL,
	"website" text,
	"languages" text[],
	"specializations" text[]
);
--> statement-breakpoint
CREATE TABLE "emergency_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"conversation_id" integer NOT NULL,
	"risk_level" text NOT NULL,
	"trigger_message" text NOT NULL,
	"location" text,
	"contacts_alerted" text[],
	"timestamp" timestamp DEFAULT now(),
	"resolved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"relationship" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"specialist_key" text NOT NULL,
	"domain" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source" text NOT NULL,
	"researcher_authors" text NOT NULL,
	"publication_year" integer NOT NULL,
	"journal_institution" text NOT NULL,
	"evidence_level" text NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"content" text NOT NULL,
	"sender" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "specialists" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"specialty" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	CONSTRAINT "specialists_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"detected_topics" text[],
	"primary_concerns" text[],
	"conversation_style" text,
	"familiarity_level" integer DEFAULT 1,
	"preferred_specialists" text[],
	"message_count" integer DEFAULT 0,
	"last_active" timestamp DEFAULT now(),
	"context_summary" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
