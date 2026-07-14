CREATE TABLE `sst_document_assessment_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`assessmentId` int NOT NULL,
	`linkType` enum('Fonte de Dados','Referência','Comprovação','Histórico') NOT NULL DEFAULT 'Fonte de Dados',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `sst_document_assessment_links_id` PRIMARY KEY(`id`)
);
