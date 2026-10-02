import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Offline only: no network connection and no write to the source database.
const [input, output] = process.argv.slice(2);
if (!input || !output || path.resolve(input) === path.resolve(output)) {
  throw new Error("Usage: npm run db:convert-export -- input.json private-data/staged-import.sql");
}
const source = await readFile(input, "utf8");
const parsed = JSON.parse(source);
const records = Array.isArray(parsed) ? parsed : parsed?.results;
if (!Array.isArray(records)) throw new Error("Expected a JSON array of venue_enquiries rows, or an object with a results array.");

const limits = { id: 36, reference: 12, name: 120, organisation: 180, email: 254, phone: 35, venue_type: 80, city: 120, message: 3000 };
const columns = [...Object.keys(limits), "contact_consent", "created_at"];
const unique = new Map();
let duplicateRows = 0;
for (let i = 0; i < records.length; i++) {
  const row = records[i];
  if (!row || typeof row !== "object" || Array.isArray(row) ||
      Object.keys(row).some(key => !columns.includes(key))) {
    throw new Error(`Row ${i + 1}: unsupported row shape or unexpected fields. No fields may be silently discarded.`);
  }
  const normalized = {};
  for (const [field, limit] of Object.entries(limits)) {
    if (typeof row[field] !== "string" || row[field].length > limit ||
        (field !== "message" && !row[field])) {
      throw new Error(`Row ${i + 1}: ${field} cannot fit the target schema. No data was truncated.`);
    }
    normalized[field] = row[field];
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id) || !/^JLY-[0-9A-F]{8}$/.test(row.reference)) {
    throw new Error(`Row ${i + 1}: invalid source ID or reference; review the export.`);
  }
  if (![0, 1, false, true].includes(row.contact_consent)) throw new Error(`Row ${i + 1}: invalid consent.`);
  normalized.contact_consent = Number(row.contact_consent);
  const timestamp = String(row.created_at);
  if (!/^\d+$/.test(timestamp) || BigInt(timestamp) > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Row ${i + 1}: invalid Unix epoch millisecond timestamp.`);
  }
  normalized.created_at = timestamp;
  const existing = unique.get(row.id);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(normalized)) {
      throw new Error(`Row ${i + 1}: conflicting duplicate ID. Review the source before importing.`);
    }
    duplicateRows++;
  } else unique.set(row.id, normalized);
}
const checksum = createHash("sha256").update(source).digest("hex");
const sqlString = value => value === "" ? "''" : `CONVERT(0x${Buffer.from(value, "utf8").toString("hex")} USING utf8mb4)`;
const statements = [...unique.values()].map(row => {
  const values = columns.map(key => key === "contact_consent" || key === "created_at" ? String(row[key]) : sqlString(row[key]));
  return `INSERT INTO venue_enquiries_import (${columns.join(", ")}) VALUES (${values.join(", ")}) ON DUPLICATE KEY UPDATE id = id;`;
});
const comparisons = columns.map(key => `BINARY target.${key} <=> BINARY staged.${key}`).join(" AND ");
const header = `-- PRIVATE CUSTOMER DATA: do not commit, attach to chat, or ship with the website.\n-- Input SHA-256: ${checksum}\n-- Expected unique rows: ${unique.size}; identical duplicate rows omitted: ${duplicateRows}\n`;
const staging = `${header}SET NAMES utf8mb4;\nCREATE TABLE IF NOT EXISTS venue_enquiries_import LIKE venue_enquiries;\nSTART TRANSACTION;\n${statements.join("\n")}\nCOMMIT;\nSELECT COUNT(*) AS staged_count FROM venue_enquiries_import;\n`;
const review = `${header}-- Run these SELECT statements first. Stop if staged_count differs from expected\n-- or conflicting_existing_rows is nonzero. Do not merge conflicting records.\nSELECT COUNT(*) AS staged_count FROM venue_enquiries_import;\nSELECT COUNT(*) AS conflicting_existing_rows FROM venue_enquiries_import staged JOIN venue_enquiries target ON target.id = staged.id WHERE NOT (${comparisons});\nSELECT COUNT(*) AS new_rows FROM venue_enquiries_import staged LEFT JOIN venue_enquiries target ON target.id = staged.id WHERE target.id IS NULL;\n\n-- AFTER reviewing the counts and conflicts, copy this block into phpMyAdmin:\n-- START TRANSACTION;\n-- INSERT INTO venue_enquiries (${columns.join(", ")})\n-- SELECT ${columns.join(", ")} FROM venue_enquiries_import\n-- ON DUPLICATE KEY UPDATE id = venue_enquiries.id;\n-- COMMIT;\n-- SELECT COUNT(*) AS target_count FROM venue_enquiries;\n`;
await writeFile(output, staging, { flag: "wx", mode: 0o600 });
await writeFile(`${output}.review.sql`, review, { flag: "wx", mode: 0o600 });
console.log(JSON.stringify({ sourceRows: records.length, uniqueRows: unique.size, identicalDuplicates: duplicateRows, sourceSha256: checksum }));
