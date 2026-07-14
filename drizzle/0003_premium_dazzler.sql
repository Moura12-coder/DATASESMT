CREATE TABLE `environmental_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`gheId` int NOT NULL,
	`agentType` enum('Químico','Físico','Biológico','Ergonômico') NOT NULL,
	`agentName` varchar(255) NOT NULL,
	`measurementValue` decimal(10,2) NOT NULL,
	`unit` varchar(50),
	`limiteTolerance` decimal(10,2),
	`status` enum('Conforme','Não Conforme','Atenção') DEFAULT 'Conforme',
	`date` date NOT NULL,
	`responsible` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `environmental_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `esocial_s2230` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`employeeId` int NOT NULL,
	`absenceId` int NOT NULL,
	`eventType` varchar(10) NOT NULL DEFAULT 'S-2230',
	`status` enum('Rascunho','Enviado','Processado','Rejeitado') DEFAULT 'Rascunho',
	`esocialResponse` json,
	`sentAt` timestamp,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `esocial_s2230_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdf_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`type` enum('Acidentes','PCMSO','PPRA','PGR','CIPA','Treinamentos','Custos') NOT NULL,
	`title` varchar(255) NOT NULL,
	`fileUrl` varchar(500),
	`fileKey` varchar(255),
	`signature` text,
	`signedBy` varchar(255),
	`signedAt` timestamp,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pdf_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technical_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`type` enum('LTCAT','PPP','Laudo Ambiental','Laudo Ergonômico') NOT NULL,
	`title` varchar(255) NOT NULL,
	`author` varchar(255) NOT NULL,
	`status` enum('Rascunho','Aguardando Aprovação','Aprovado','Vigente','Expirado') DEFAULT 'Rascunho',
	`validFrom` date NOT NULL,
	`validUntil` date NOT NULL,
	`content` text,
	`fileUrl` varchar(500),
	`fileKey` varchar(255),
	`signature` text,
	`signedBy` varchar(255),
	`signedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technical_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technical_reports_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`version` int NOT NULL,
	`status` enum('Rascunho','Aguardando Aprovação','Aprovado','Vigente','Expirado') NOT NULL,
	`approver` varchar(255),
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `technical_reports_history_id` PRIMARY KEY(`id`)
);
