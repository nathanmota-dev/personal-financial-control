CREATE TABLE `user_onboarding` (
  `user_id` text PRIMARY KEY NOT NULL,
  `current_step` integer DEFAULT 1 NOT NULL,
  `completed_at` text,
  CONSTRAINT `onboarding_step_range` CHECK (`current_step` BETWEEN 1 AND 5)
);
