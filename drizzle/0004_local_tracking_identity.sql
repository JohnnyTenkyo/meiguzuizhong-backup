ALTER TABLE `tracked_people` DROP FOREIGN KEY `tracked_people_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `tracked_people` DROP INDEX `tracked_people_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `tracked_people` ADD CONSTRAINT `tracked_people_userId_local_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `local_users`(`id`) ON DELETE cascade ON UPDATE no action;
