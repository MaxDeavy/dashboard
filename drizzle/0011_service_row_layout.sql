ALTER TABLE `services` ADD COLUMN `row_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD COLUMN `slot_index` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `services` SET `row_order` = `sort_order`, `slot_index` = 0;
