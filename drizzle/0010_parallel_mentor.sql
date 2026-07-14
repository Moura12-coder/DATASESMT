CREATE TABLE `apr_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`unitId` int NOT NULL,
	`activityDescription` text NOT NULL,
	`hazardsIdentified` json,
	`riskAssessment` json,
	`recommendedActions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apr_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aso_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`employeeId` int NOT NULL,
	`occupationalMedic` varchar(255) NOT NULL,
	`occupationalMedicId` int,
	`examsPerformed` json,
	`conclusion` enum('Apto','Apto com Restrições','Inapto','Inapto Temporariamente') NOT NULL,
	`restrictionDetails` text,
	`examinationDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aso_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `epi_control_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`employeeId` int NOT NULL,
	`epiItems` json,
	`deliveryDate` date NOT NULL,
	`returnDate` date,
	`condition` enum('Novo','Usado','Danificado','Devolvido') NOT NULL,
	`employeeSignature` text,
	`supervisorSignature` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `epi_control_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ergonomic_assessment_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`unitId` int NOT NULL,
	`workstationDescription` text,
	`postureAnalysis` text,
	`risksIdentified` json,
	`recommendedImprovements` text,
	`priorityLevel` enum('Baixa','Média','Alta','Crítica') DEFAULT 'Média',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ergonomic_assessment_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ltcat_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`unitId` int NOT NULL,
	`specialActivities` json,
	`exposureFactors` text,
	`conclusionSpecialRetirement` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ltcat_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ltip_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`unitId` int NOT NULL,
	`insalubrityLevel` enum('Mínimo','Médio','Máximo','Nenhum') NOT NULL,
	`insalubrityPercentage` decimal(5,2),
	`dangerLevel` enum('Presente','Ausente') NOT NULL,
	`dangerPercentage` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ltip_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pcmso_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`unitId` int NOT NULL,
	`occupationalMedic` varchar(255) NOT NULL,
	`occupationalMedicId` int,
	`examsRequired` json,
	`riskFactorsIdentified` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pcmso_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pgr_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`unitId` int NOT NULL,
	`inventoryOfRisks` text,
	`actionPlan` text,
	`responsibleTeam` varchar(500),
	`implementationDeadline` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pgr_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sst_document_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`versionId` int,
	`approverRole` enum('Técnico de SST','Gerente','Diretor','Médico do Trabalho','Engenheiro de Segurança') NOT NULL,
	`approverName` varchar(255) NOT NULL,
	`approverId` int NOT NULL,
	`status` enum('Pendente','Aprovado','Rejeitado','Revisão Solicitada') NOT NULL DEFAULT 'Pendente',
	`comments` text,
	`approvedAt` timestamp,
	`signature` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sst_document_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sst_document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`version` int NOT NULL,
	`revision` varchar(20) NOT NULL,
	`status` enum('Rascunho','Aguardando Aprovação','Aprovado','Vigente','Expirado','Cancelado') NOT NULL,
	`fileKey` varchar(500),
	`fileUrl` varchar(1000),
	`content` text,
	`changeNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	CONSTRAINT `sst_document_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sst_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`type` enum('PGR','PCMSO','LTCAT','LTIP','Ordem de Serviço','Permissão de Trabalho','APR','ASO','Ficha de Controle de EPI','Avaliação Ergonômica Preliminar') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`author` varchar(255) NOT NULL,
	`authorId` int NOT NULL,
	`status` enum('Rascunho','Aguardando Aprovação','Aprovado','Vigente','Expirado','Cancelado') NOT NULL DEFAULT 'Rascunho',
	`revision` varchar(20) NOT NULL DEFAULT 'Rev. 01',
	`validFrom` date,
	`validUntil` date,
	`fileKey` varchar(500),
	`fileUrl` varchar(1000),
	`fileName` varchar(255),
	`fileSize` int,
	`mimeType` varchar(100),
	`signature` text,
	`signedBy` varchar(255),
	`signedById` int,
	`signedAt` timestamp,
	`content` text,
	`metadata` json,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int NOT NULL,
	`updatedBy` int,
	CONSTRAINT `sst_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_order_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`unitId` int NOT NULL,
	`workDescription` text NOT NULL,
	`responsibleEmployee` varchar(255) NOT NULL,
	`responsibleEmployeeId` int,
	`startDate` date NOT NULL,
	`endDate` date,
	`priority` enum('Baixa','Média','Alta','Urgente') DEFAULT 'Média',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_order_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_permit_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`unitId` int NOT NULL,
	`workType` varchar(255) NOT NULL,
	`hazardsIdentified` text,
	`controlMeasures` text,
	`authorizedBy` varchar(255) NOT NULL,
	`authorizedById` int,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_permit_documents_id` PRIMARY KEY(`id`)
);
