CREATE TABLE `venue_enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`name` text NOT NULL,
	`organisation` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`venue_type` text NOT NULL,
	`city` text NOT NULL,
	`message` text NOT NULL,
	`contact_consent` integer NOT NULL,
	`created_at` integer NOT NULL
);
