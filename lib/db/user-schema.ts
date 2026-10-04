import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const authorizedUsers = sqliteTable("authorized_users", {
  email: text("email").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userOnboarding = sqliteTable("user_onboarding", {
  userId: text("user_id").primaryKey(),
  currentStep: integer("current_step").notNull().default(1),
  completedAt: text("completed_at"),
}, table => [check("onboarding_step_range", sql`${table.currentStep} BETWEEN 1 AND 5`)]);
