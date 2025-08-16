#!/usr/bin/env node

/**
 * Script to create a new database migration
 * Usage: node migrate/create-migration.js "migration-name"
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Colors for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function printInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function validateMigrationName(name) {
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(name);
}

function main() {
  // Check arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printError("Migration name is required!");
    console.log("");
    console.log('Usage: node migrate/create-migration.js "migration-name"');
    console.log(
      'Example: node migrate/create-migration.js "add-user-profile-table"',
    );
    console.log(
      'Example: node migrate/create-migration.js "update-posts-schema"',
    );
    console.log("");
    process.exit(1);
  }

  const migrationName = args[0];

  // Validate migration name
  if (!validateMigrationName(migrationName)) {
    printError(
      "Migration name can only contain letters, numbers, hyphens, and underscores",
    );
    process.exit(1);
  }

  // Check if package.json exists
  const packageJsonPath = join(projectRoot, "package.json");
  if (!existsSync(packageJsonPath)) {
    printError(
      "package.json not found. Please run this script from the project root.",
    );
    process.exit(1);
  }

  printInfo(`Creating migration: ${migrationName}`);

  try {
    // Run the migration creation command with hardcoded config
    execSync(
      `npx node-pg-migrate create "${migrationName}" --migrations-dir migrations --migration-filename-format utc --migration-file-language js`,
      {
        cwd: projectRoot,
        stdio: "inherit",
      },
    );

    printSuccess("Migration created successfully!");
    console.log("");
    printInfo("Next steps:");
    console.log("1. Edit the migration file in the migrations/ directory");
    console.log("2. To apply migrations automatically, run:");
    console.log(
      `   ${colors.yellow}docker compose down && docker compose up -d --build${colors.reset}`,
    );
    console.log("");
    console.log("3. To run migrations manually:");
    console.log(
      `   ${colors.yellow}docker compose run --rm migrate npm run migrate:up${colors.reset}`,
    );
    console.log("");
    console.log("4. To rollback the last migration:");
    console.log(
      `   ${colors.yellow}docker compose run --rm migrate npm run migrate:down${colors.reset}`,
    );
    console.log("");
    printWarning(
      "Remember to test your migration in a development environment first!",
    );
  } catch (error) {
    printError("Failed to create migration");
    process.exit(1);
  }
}

main();
