CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`userId` int,
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('Acidentes','Treinamentos','Conformidade','Custos','Indicadores') NOT NULL,
	`period` enum('Diário','Semanal','Mensal','Trimestral','Anual') NOT NULL,
	`data` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`approverUserId` int NOT NULL,
	`action` enum('Aprovado','Rejeitado','Comentário','Devolvido') NOT NULL,
	`comment` text,
	`approvedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`currentStep` int DEFAULT 1,
	`status` enum('Pendente','Em Análise','Aprovado','Rejeitado','Cancelado') DEFAULT 'Pendente',
	`rejectionReason` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approval_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`approverRole` varchar(100) NOT NULL,
	`approverUserId` int,
	`description` text,
	`requiresComment` boolean DEFAULT false,
	`canReject` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`entityType` varchar(100) NOT NULL,
	`steps` int DEFAULT 1,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approval_workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('Executivo','Operacional','Segurança','Compliance','Financeiro') NOT NULL,
	`layout` json,
	`isPublic` boolean DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_systems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('RH','ERP','eSocial','Folha','Outro') NOT NULL,
	`endpoint` varchar(500),
	`apiKey` text,
	`isActive` boolean DEFAULT false,
	`lastSync` timestamp,
	`syncStatus` enum('Sucesso','Erro','Pendente') DEFAULT 'Pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `external_systems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dashboardId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`metric` varchar(100) NOT NULL,
	`value` decimal(10,2),
	`target` decimal(10,2),
	`unit` varchar(50),
	`status` enum('Ótimo','Bom','Atenção','Crítico') DEFAULT 'Bom',
	`trend` enum('Aumentando','Estável','Diminuindo') DEFAULT 'Estável',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kpis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`systemId` int NOT NULL,
	`syncType` varchar(100) NOT NULL,
	`status` enum('Iniciado','Processando','Sucesso','Erro') NOT NULL,
	`recordsProcessed` int DEFAULT 0,
	`recordsSuccessful` int DEFAULT 0,
	`recordsFailed` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `sync_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sync_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`systemId` int NOT NULL,
	`sourceField` varchar(255) NOT NULL,
	`targetField` varchar(255) NOT NULL,
	`transformation` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookId` int NOT NULL,
	`status` enum('Enviado','Falha','Sucesso') NOT NULL,
	`payload` json,
	`response` text,
	`statusCode` int,
	`triggeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`event` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`isActive` boolean DEFAULT true,
	`retryCount` int DEFAULT 0,
	`lastTriggered` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
