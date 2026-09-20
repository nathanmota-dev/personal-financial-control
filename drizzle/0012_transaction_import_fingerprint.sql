ALTER TABLE `transactions` ADD `import_fingerprint` text;
CREATE UNIQUE INDEX `transactions_import_fingerprint_unique` ON `transactions` (`import_fingerprint`);
