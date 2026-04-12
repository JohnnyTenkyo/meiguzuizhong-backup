CREATE TABLE `ai_conversation_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_conversation_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`agentType` enum('stock','foci') NOT NULL DEFAULT 'stock',
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversation_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `watchlist` DROP FOREIGN KEY `watchlist_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `watchlist` ADD `localUserId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_conversation_messages` ADD CONSTRAINT `ai_conversation_messages_threadId_ai_conversation_threads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `ai_conversation_threads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ai_conversation_threads` ADD CONSTRAINT `ai_conversation_threads_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist` ADD CONSTRAINT `watchlist_localUserId_local_users_id_fk` FOREIGN KEY (`localUserId`) REFERENCES `local_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist` DROP COLUMN `userId`;