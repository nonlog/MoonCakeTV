/**
 * Application-wide constants
 */

// Authentication
export const AUTH_CONSTANTS = {
  // Password requirements
  MIN_PASSWORD_LENGTH: 6,

  // JWT settings
  JWT_EXPIRATION: "180d",
  JWT_EXPIRATION_SECONDS: 60 * 60 * 24 * 180, // 180 days in seconds

  // Bcrypt settings
  SALT_ROUNDS: 10,

  // Cookie settings
  COOKIE_MAX_AGE: 60 * 60 * 24 * 180, // 180 days in seconds
} as const;

// Database
export const DB_CONSTANTS = {
  DEFAULT_QUERY_TIMEOUT: 30000, // 30 seconds
} as const;

// Redis
export const REDIS_CONSTANTS = {
  JWT_BLACKLIST_PREFIX: "logout:jti:",
  JWT_BLACKLIST_TTL: 60 * 60 * 24 * 180, // 180 days in seconds
} as const;

// API Response codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
