CREATE TABLE `link_bars` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zone` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`title` text
);
--> statement-breakpoint
INSERT INTO `link_bars` (`zone`, `sort_order`, `title`) VALUES ('header', 0, 'Hauptleiste');
--> statement-breakpoint
CREATE TABLE `__new_nav_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bar_id` integer NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`bar_id`) REFERENCES `link_bars`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_nav_links` (`id`, `bar_id`, `label`, `url`, `icon`, `sort_order`)
SELECT `id`, 1, `label`, `url`, `icon`, `sort_order` FROM `nav_links`;
--> statement-breakpoint
DROP TABLE `nav_links`;
--> statement-breakpoint
ALTER TABLE `__new_nav_links` RENAME TO `nav_links`;
