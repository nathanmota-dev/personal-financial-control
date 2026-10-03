/// <reference types="vite/client" />
// Keep eager registration in a separate module so dependencies are controlled
// before Vite evaluates any page imports. Cases cannot be discovered twice.
import.meta.glob(["./**/*.cases.ts", "./**/*.cases.tsx"], { eager: true });
