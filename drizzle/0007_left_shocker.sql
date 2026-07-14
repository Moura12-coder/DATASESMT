ALTER TABLE `ghe` DROP INDEX `ghe_code_unique`;--> statement-breakpoint
ALTER TABLE `ghe` ADD CONSTRAINT `ghe_unitId_code_unique` UNIQUE(`unitId`,`code`);