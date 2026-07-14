CREATE TABLE `risk_map_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaId` int NOT NULL,
	`unitId` int NOT NULL,
	`oldRiskLevel` varchar(50),
	`newRiskLevel` varchar(50) NOT NULL,
	`severity` enum('low','medium','high') DEFAULT 'medium',
	`acknowledged` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	`acknowledgedAt` timestamp,
	`acknowledgedBy` int,
	CONSTRAINT `risk_map_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_map_area_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaId` int NOT NULL,
	`changeType` enum('position_update','name_update','risk_update','rollback') NOT NULL,
	`oldValue` text,
	`newValue` text,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_map_area_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risk_map_comparisons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`period1Start` date NOT NULL,
	`period1End` date NOT NULL,
	`period2Start` date NOT NULL,
	`period2End` date NOT NULL,
	`comparisonData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `risk_map_comparisons_id` PRIMARY KEY(`id`)
);
