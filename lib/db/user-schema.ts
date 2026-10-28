import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const authorizedUsers = sqliteTable("authorized_users", {
  email: text("email").primaryKey(),
  displayName: text("display_name"),
  pinHash: text("pin_hash"),
  pinFailedAttempts: integer("pin_failed_attempts").notNull().default(0),
  pinResetRequested: integer("pin_reset_requested", { mode: "boolean" }).notNull().default(false),
  sessionVersion: integer("session_version").notNull().default(0),
  lockTimeoutMinutes: integer("lock_timeout_minutes").notNull().default(15),
  lockOnClose: integer("lock_on_close", { mode: "boolean" }).notNull().default(true),
  mcpTokenHash: text("mcp_token_hash"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [check("lock_timeout_range", sql`${table.lockTimeoutMinutes} BETWEEN 1 AND 120`)]);

export const userOnboarding = sqliteTable("user_onboarding", {
  userId: text("user_id").primaryKey(),
  currentStep: integer("current_step").notNull().default(1),
  completedAt: text("completed_at"),
}, table => [check("onboarding_step_range", sql`${table.currentStep} BETWEEN 1 AND 5`)]);
