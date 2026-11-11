CREATE TABLE `bands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bands_name_uq` ON `bands` (lower("name"));--> statement-breakpoint
CREATE TABLE `concert_bands` (
	`concert_id` integer NOT NULL,
	`band_id` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_headliner` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`concert_id`, `band_id`),
	FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`band_id`) REFERENCES `bands`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `concert_bands_band_idx` ON `concert_bands` (`band_id`);--> statement-breakpoint
CREATE TABLE `concert_people` (
	`concert_id` integer NOT NULL,
	`person_id` integer NOT NULL,
	PRIMARY KEY(`concert_id`, `person_id`),
	FOREIGN KEY (`concert_id`) REFERENCES `concerts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `concert_people_person_idx` ON `concert_people` (`person_id`);--> statement-breakpoint
CREATE TABLE `concerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`venue_id` integer NOT NULL,
	`event_id` integer,
	`ticket_price_cents` integer,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`rating` integer,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `concerts_date_idx` ON `concerts` (`date`);--> statement-breakpoint
CREATE INDEX `concerts_venue_idx` ON `concerts` (`venue_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_name_uq` ON `events` (lower("name"));--> statement-breakpoint
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `people_name_uq` ON `people` (lower("name"));--> statement-breakpoint
CREATE TABLE `venues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`city` text,
	`country` text,
	`lat` real,
	`lng` real,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `venues_name_city_uq` ON `venues` (lower("name"), lower(coalesce("city", '')));
