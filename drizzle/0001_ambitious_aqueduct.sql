CREATE TABLE `action_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riskId` int,
	`incidentId` int,
	`inspectionId` int,
	`what` varchar(500) NOT NULL,
	`why` varchar(500),
	`who` varchar(255) NOT NULL,
	`where` varchar(255),
	`when` date NOT NULL,
	`howMuch` decimal(10,2),
	`how` text,
	`status` enum('Pendente','Em Andamento','Concluída','Cancelada') NOT NULL DEFAULT 'Pendente',
	`priority` enum('Baixa','Média','Alta','Crítica') DEFAULT 'Média',
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `action_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_chats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cipa_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`date` timestamp NOT NULL,
	`type` enum('Ordinária','Extraordinária') DEFAULT 'Ordinária',
	`agenda` text,
	`minutes` text,
	`minutesFileKey` varchar(500),
	`status` enum('Agendada','Realizada','Cancelada') DEFAULT 'Agendada',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cipa_meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cipa_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`employeeId` int NOT NULL,
	`role` enum('Presidente','Vice-Presidente','Secretário','Membro Efetivo','Membro Suplente') NOT NULL,
	`origin` enum('Eleito','Indicado') DEFAULT 'Eleito',
	`mandateStart` date,
	`mandateEnd` date,
	`status` enum('Ativo','Inativo') DEFAULT 'Ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cipa_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cnpj` varchar(20),
	`cnae` varchar(20),
	`grauRisco` enum('1','2','3','4') DEFAULT '1',
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`phone` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int,
	`description` varchar(255) NOT NULL,
	`category` enum('EPI','Exame','Treinamento','Consultor','Equipamento','Outro') NOT NULL,
	`value` decimal(12,2) NOT NULL,
	`date` date NOT NULL,
	`status` enum('Pago','Pendente','Cancelado') DEFAULT 'Pendente',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int,
	`title` varchar(255) NOT NULL,
	`type` enum('PGR','PCMSO','LTCAT','PPP','ASO','CAT','Laudo','Certificado','Procedimento','Outro') NOT NULL,
	`revision` varchar(20) DEFAULT 'Rev. 01',
	`status` enum('Vigente','Em Revisão','Obsoleto') DEFAULT 'Vigente',
	`fileKey` varchar(500),
	`fileUrl` varchar(1000),
	`fileName` varchar(255),
	`fileSize` int,
	`mimeType` varchar(100),
	`validFrom` date,
	`validUntil` date,
	`author` varchar(255),
	`description` text,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`sectorId` int,
	`name` varchar(255) NOT NULL,
	`cpf` varchar(14),
	`rg` varchar(20),
	`role` varchar(255),
	`department` varchar(255),
	`admissionDate` date,
	`birthDate` date,
	`phone` varchar(20),
	`email` varchar(320),
	`status` enum('Ativo','Afastado','Férias','Desligado') NOT NULL DEFAULT 'Ativo',
	`esocialCategory` varchar(10),
	`pis` varchar(20),
	`ctps` varchar(30),
	`bloodType` varchar(5),
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `epi_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`epiId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`deliveryDate` date NOT NULL,
	`returnDate` date,
	`reason` varchar(255),
	`signatureFileKey` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `epi_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `epi_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`ca` varchar(30),
	`caExpiration` date,
	`manufacturer` varchar(255),
	`type` varchar(100),
	`stock` int NOT NULL DEFAULT 0,
	`minStock` int NOT NULL DEFAULT 0,
	`unitCost` decimal(10,2) DEFAULT '0',
	`unit` varchar(20) DEFAULT 'un',
	`location` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `epi_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `esocial_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` enum('S-2210','S-2220','S-2240','S-2245') NOT NULL,
	`employeeId` int,
	`referenceId` int,
	`referenceType` varchar(50),
	`eventDate` timestamp NOT NULL,
	`status` enum('Pendente','Enviado','Sucesso','Erro','Retificado') DEFAULT 'Pendente',
	`protocol` varchar(100),
	`errorMessage` text,
	`payload` json,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `esocial_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('Admissional','Periódico','Demissional','Retorno ao Trabalho','Mudança de Função') NOT NULL,
	`examDate` date NOT NULL,
	`expirationDate` date,
	`doctor` varchar(255),
	`crm` varchar(20),
	`result` enum('Apto','Apto com Restrições','Inapto Temporário','Inapto') DEFAULT 'Apto',
	`restrictions` text,
	`asoFileKey` varchar(500),
	`status` enum('Válido','A Vencer','Vencido') DEFAULT 'Válido',
	`esocialSent` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`sectorId` int,
	`employeeId` int,
	`type` enum('Acidente com Afastamento','Acidente sem Afastamento','Quase Acidente','Doença Ocupacional','Incidente Perigoso') NOT NULL,
	`date` timestamp NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255),
	`bodyPart` varchar(255),
	`injuryType` varchar(255),
	`daysLost` int DEFAULT 0,
	`catNumber` varchar(30),
	`catDate` date,
	`investigationMethod` enum('5 Porquês','Árvore de Causas','FMEA','Outro'),
	`rootCauses` json,
	`immediateActions` text,
	`status` enum('Aberto','Em Investigação','Aguardando Ação','Encerrado') DEFAULT 'Aberto',
	`esocialSent` boolean DEFAULT false,
	`esocialProtocol` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`sectorId` int,
	`title` varchar(255) NOT NULL,
	`type` enum('Rotina','Especial','Auditoria','Pós-Acidente') DEFAULT 'Rotina',
	`inspector` varchar(255),
	`inspectionDate` date NOT NULL,
	`nr` varchar(20),
	`checklist` json,
	`nonConformities` int DEFAULT 0,
	`conformities` int DEFAULT 0,
	`score` decimal(5,2),
	`status` enum('Agendada','Em Andamento','Concluída') DEFAULT 'Agendada',
	`notes` text,
	`reportFileKey` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_of_absence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`type` enum('Acidente Trabalho','Doença Ocupacional','Doença Comum','Maternidade','Outro') NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date,
	`cid` varchar(10),
	`catNumber` varchar(30),
	`daysCount` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leave_of_absence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`type` enum('exam_expiry','epi_stock','training_expiry','action_deadline','incident','general') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`referenceId` int,
	`referenceType` varchar(50),
	`read` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`sectorId` int,
	`type` enum('Físico','Químico','Biológico','Ergonômico','Acidente','Psicossocial') NOT NULL,
	`description` varchar(500) NOT NULL,
	`source` varchar(255),
	`ghe` varchar(255),
	`probability` enum('1','2','3','4','5') DEFAULT '1',
	`severity` enum('1','2','3','4','5') DEFAULT '1',
	`riskLevel` enum('Tolerável','Moderado','Substancial','Intolerável') DEFAULT 'Tolerável',
	`controlMeasures` text,
	`existingControls` text,
	`residualRisk` enum('Tolerável','Moderado','Substancial','Intolerável') DEFAULT 'Tolerável',
	`responsible` varchar(255),
	`deadline` date,
	`status` enum('Identificado','Em Controle','Controlado') DEFAULT 'Identificado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sectors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`responsible` varchar(255),
	`riskLevel` enum('Baixo','Médio','Alto','Crítico') DEFAULT 'Baixo',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sectors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `third_parties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int,
	`companyName` varchar(255) NOT NULL,
	`cnpj` varchar(20),
	`contact` varchar(255),
	`phone` varchar(20),
	`email` varchar(320),
	`serviceType` varchar(255),
	`contractStart` date,
	`contractEnd` date,
	`status` enum('Ativo','Inativo','Suspenso') DEFAULT 'Ativo',
	`pgr` boolean DEFAULT false,
	`pcmso` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `third_parties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`employeeId` int NOT NULL,
	`completionDate` date NOT NULL,
	`expiryDate` date,
	`status` enum('Vigente','A Vencer','Vencido') DEFAULT 'Vigente',
	`score` decimal(5,2),
	`certificateFileKey` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `training_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`nr` varchar(20),
	`type` enum('Integração','Periódico','Específico','Reciclagem','Outro') DEFAULT 'Periódico',
	`instructor` varchar(255),
	`workload` int,
	`validityMonths` int DEFAULT 12,
	`targetRoles` json,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainings_id` PRIMARY KEY(`id`)
);
