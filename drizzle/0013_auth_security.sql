-- Resolve legacy duplicate emails before migrating; this check runs first.
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
ALTER TABLE `users`
 ADD COLUMN `registrationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
 ADD COLUMN `rejectionReason` text,
 ADD COLUMN `companyName` varchar(255),
 ADD COLUMN `cnpj` varchar(20),
 ADD COLUMN `phone` varchar(20),
 ADD COLUMN `sessionVersion` int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `ghe`
 ADD COLUMN `location` varchar(255),
 ADD COLUMN `responsible` varchar(255),
 ADD COLUMN `status` enum('Ativo','Inativo','Em Revisão') NOT NULL DEFAULT 'Ativo',
 ADD COLUMN `notes` text;
