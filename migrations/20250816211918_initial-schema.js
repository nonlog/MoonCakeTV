import bcrypt from "bcryptjs";

/**
 * Initial database schema for MooncakeTV
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | Promise<void>}
 * @returns {Promise<void> | void}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  // Create extensions
  pgm.createExtension("uuid-ossp", { ifNotExists: true });
  pgm.createExtension("pg_trgm", { ifNotExists: true });

  // Create users table
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    username: {
      type: "text",
      unique: true,
      notNull: true,
    },
    password_hash: {
      type: "text",
      notNull: true,
    },
    email: {
      type: "text",
      unique: true,
    },
    email_verified: {
      type: "boolean",
      default: false,
    },
    role: {
      type: "text",
      notNull: true,
      default: "user",
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  // Create user_data table
  pgm.createTable("user_data", {
    user_id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    bookmarks: {
      type: "jsonb",
      default: "'{}'",
    },
    settings: {
      type: "jsonb",
      default: "'{}'",
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  // Create indexes
  pgm.createIndex("users", "email");
  pgm.createIndex("users", "username");
  pgm.createIndex("user_data", "user_id");

  // Create function to update updated_at
  pgm.createFunction(
    "update_updated_at_column",
    [],
    {
      returns: "trigger",
      language: "plpgsql",
      replace: true,
    },
    `
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    `,
  );

  // Create trigger for users table
  pgm.createTrigger("users", "update_users_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_updated_at_column",
    level: "ROW",
  });

  // Create trigger for user_data table
  pgm.createTrigger("user_data", "update_user_data_updated_at", {
    when: "BEFORE",
    operation: "UPDATE",
    function: "update_updated_at_column",
    level: "ROW",
  });

  // Seed admin user if environment variables are provided
  const adminUsername = process.env.MC_ADMIN_USERNAME;
  const adminPassword = process.env.MC_ADMIN_PASSWORD;

  if (adminUsername && adminPassword) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);

    pgm.sql(`
      INSERT INTO users (username, password_hash, role)
      VALUES ('${adminUsername}', '${hash}', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);
  }
};

export const down = (pgm) => {
  pgm.dropTable("user_data");
  pgm.dropTable("users");

  pgm.dropFunction("update_updated_at_column", []);

  pgm.dropExtension("pg_trgm");
  pgm.dropExtension("uuid-ossp");
};
