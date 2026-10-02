import { access, cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const standalone = path.join(root, ".next/standalone");
await access(path.join(standalone, "server.js"));
await mkdir(path.join(standalone, ".next"), { recursive: true });
await rm(path.join(standalone, ".next/static"), { recursive: true, force: true });
await cp(path.join(root, ".next/static"), path.join(standalone, ".next/static"), { recursive: true });
try {
  await access(path.join(root, "public"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.log("Standalone server and static assets prepared (no public directory).");
  process.exit(0);
}
await rm(path.join(standalone, "public"), { recursive: true, force: true });
await cp(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
console.log("Standalone server, public assets and Next.js static assets prepared.");
