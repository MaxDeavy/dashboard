CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `categories` ADD COLUMN `page_id` integer REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade;
