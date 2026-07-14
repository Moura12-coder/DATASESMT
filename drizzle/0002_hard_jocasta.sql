CREATE TABLE `employee_ghe` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`gheId` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_ghe_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ghe` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`riskMapAreaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ghe_id` PRIMARY KEY(`id`),
	CONSTRAINT `ghe_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `ghe_exposure_agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gheId` int NOT NULL,
	`agentType` enum('Químico','Físico','Biológico','Ergonômico','Acidente'),
	`agentName` varchar(255) NOT NULL,
	`riskLevel` enum('Tolerável','Moderado','Substancial','Intolerável'),
	`limiteTolerance` decimal(10,2),
	`unit` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ghe_exposure_agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_map_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`coordinates` json,
	`riskLevel` enum('Tolerável','Moderado','Substancial','Intolerável') DEFAULT 'Tolerável',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risk_map_areas_id` PRIMARY KEY(`id`)
);
