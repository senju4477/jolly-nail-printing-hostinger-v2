import nextEnv from "@next/env";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
nextEnv.loadEnvConfig(root, false);
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT ??= "3000";
if (!/^\d+$/.test(process.env.PORT) || Number(process.env.PORT) < 1 || Number(process.env.PORT) > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
const server = new URL("../.next/standalone/server.js", import.meta.url);
try {
  await access(server);
} catch {
  throw new Error("Standalone server is missing. Run npm run build before npm start.");
}
await import(server.href);
