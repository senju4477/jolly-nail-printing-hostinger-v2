import "server-only";
import { createPool, type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function getDb(): Pool {
  if (pool) return pool;
  for (const key of ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const) {
    if (!process.env[key]) throw new Error("DATABASE_NOT_CONFIGURED");
  }
  const port = process.env.DB_PORT ?? "3306";
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error("DATABASE_PORT_INVALID");
  }
  pool = createPool({
    host: process.env.DB_HOST,
    port: Number(port),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
    timezone: "Z",
    ssl: process.env.DB_SSL === "true" || process.env.DB_SSL_CA
      ? { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}) }
      : undefined,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    queueLimit: 20,
    connectTimeout: 5_000,
    enableKeepAlive: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: false,
  });
  return pool;
}
