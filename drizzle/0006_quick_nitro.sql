CREATE TABLE `ghe_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gheId` int NOT NULL,
	`unitId` int NOT NULL,
	`action` enum('CREATE','UPDATE','DELETE') NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`changes` json,
	`oldValues` json,
	`newValues` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ghe_audit_log_id` PRIMARY KEY(`id`)
);
