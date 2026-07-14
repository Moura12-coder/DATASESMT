CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`oldValue` text,
	`newValue` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('Sucesso','Erro','Acesso Negado') DEFAULT 'Sucesso',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `change_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int NOT NULL,
	`changeType` enum('Criação','Modificação','Exclusão','Aprovação','Rejeição') NOT NULL,
	`changedBy` varchar(255),
	`oldValue` text,
	`newValue` text,
	`reason` text,
	`approvedBy` varchar(255),
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `change_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_integrity_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkType` varchar(100) NOT NULL,
	`entityType` varchar(100),
	`status` enum('Passou','Falhou','Aviso') NOT NULL,
	`description` text,
	`affectedRecords` int DEFAULT 0,
	`correctionApplied` boolean DEFAULT false,
	`correctedBy` varchar(255),
	`correctedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_integrity_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`documentType` enum('Contrato','Exame','Treinamento','EPI','Laudo','Outro') NOT NULL,
	`title` varchar(255) NOT NULL,
	`fileUrl` varchar(500),
	`fileKey` varchar(255),
	`issueDate` date,
	`expiryDate` date,
	`status` enum('Ativo','Expirado','Arquivado') DEFAULT 'Ativo',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('Documento Expirado','Treinamento Vencido','EPI Necessário','Não Conformidade','Aviso','Informação') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedId` int,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_training_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`trainingId` int NOT NULL,
	`accessDate` timestamp NOT NULL DEFAULT (now()),
	`completionDate` timestamp,
	`status` enum('Pendente','Em Progresso','Concluído','Expirado') DEFAULT 'Pendente',
	`certificateUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_training_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `epc_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`sectorId` int,
	`name` varchar(255) NOT NULL,
	`type` enum('Proteção Respiratória','Proteção Auditiva','Proteção Visual','Proteção de Extremidades','Proteção de Corpo','Proteção de Queda','Outro') NOT NULL,
	`quantity` int DEFAULT 0,
	`installationDate` date,
	`lastMaintenanceDate` date,
	`nextMaintenanceDate` date,
	`maintenanceFrequency` varchar(50),
	`status` enum('Operacional','Em Manutenção','Danificado','Descartado') DEFAULT 'Operacional',
	`responsible` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epc_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `epc_maintenance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`epcItemId` int NOT NULL,
	`maintenanceDate` date NOT NULL,
	`type` enum('Inspeção','Limpeza','Reparo','Substituição','Teste') NOT NULL,
	`responsible` varchar(255),
	`notes` text,
	`nextScheduledDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `epc_maintenance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `non_conformities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`sectorId` int,
	`type` enum('NR Violada','Procedimento Inadequado','Equipamento Defeituoso','Falta de Treinamento','Outro') NOT NULL,
	`severity` enum('Baixa','Média','Alta','Crítica') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`detectedDate` date NOT NULL,
	`detectedBy` varchar(255),
	`status` enum('Aberta','Em Análise','Plano de Ação','Em Execução','Fechada','Cancelada') DEFAULT 'Aberta',
	`dueDate` date,
	`closedDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `non_conformities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `non_conformity_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nonConformityId` int NOT NULL,
	`action` text NOT NULL,
	`responsible` varchar(255),
	`dueDate` date,
	`completionDate` date,
	`status` enum('Planejada','Em Execução','Concluída','Atrasada') DEFAULT 'Planejada',
	`evidence` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `non_conformity_actions_id` PRIMARY KEY(`id`)
);
