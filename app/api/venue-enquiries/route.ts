import { getDb } from "@/db";
import type { VenueEnquiryRow } from "@/db/schema";
import { siteOrigin } from "@/lib/site-config";

export const runtime = "nodejs";

const allowedVenues = new Set(["Shopping centre", "Beauty venue / salon", "Entertainment venue", "Retail landlord", "Hotel / gym", "Other venue"]);
const noCache = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // SITE_URL also permits the public HTTPS origin behind Hostinger's Node proxy.
  if (origin && origin !== new URL(request.url).origin && origin !== siteOrigin()) {
    return Response.json({ error: "Please send your enquiry from the Jolly website." }, { status: 403, headers: noCache });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Send the form as JSON." }, { status: 415, headers: noCache });
  }
  let textBody: string;
  try {
    if (Number(request.headers.get("content-length")) > 12000) throw new Error("BODY_TOO_LARGE");
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 12000) {
            await reader.cancel();
            throw new Error("BODY_TOO_LARGE");
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    textBody = Buffer.concat(chunks).toString("utf8");
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "BODY_TOO_LARGE";
    return Response.json({ error: tooLarge ? "Your message is too long. Please shorten it and try again." : "Please check your enquiry and try again." }, { status: tooLarge ? 413 : 400, headers: noCache });
  }
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(textBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed;
  } catch {
    return Response.json({ error: "Please check your enquiry and try again." }, { status: 400, headers: noCache });
  }
  const clean = (key: string) => typeof body[key] === "string" ? (body[key] as string).trim() : "";
  const values = {
    name: clean("name"), organisation: clean("organisation"), email: clean("email").toLowerCase(), phone: clean("phone"),
    venueType: clean("venueType"), city: clean("city"), message: clean("message"), id: clean("submissionId"),
  };
  if (clean("website")) return Response.json({ error: "Please leave the website field empty and try again." }, { status: 400, headers: noCache });
  if (!values.name || values.name.length > 120 || !values.organisation || values.organisation.length > 180 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254 ||
      !/^[+\d\s().-]{6,35}$/.test(values.phone) || !values.city || values.city.length > 120 ||
      !allowedVenues.has(values.venueType) || values.message.length > 3000 || body.consent !== true ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(values.id)) {
    return Response.json({ error: "Check your name, organisation, email, phone, location, venue type and contact permission, then try again." }, { status: 400, headers: noCache });
  }
  const reference = "JLY-" + values.id.replaceAll("-", "").slice(0, 8).toUpperCase();
  try {
    const connection = await getDb().getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute({
        sql: "INSERT INTO venue_enquiries (id, reference, name, organisation, email, phone, venue_type, city, message, contact_consent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id",
        timeout: 10_000,
      }, [values.id, reference, values.name, values.organisation, values.email, values.phone, values.venueType, values.city, values.message, 1, Date.now()]);
      const [rows] = await connection.execute<VenueEnquiryRow[]>({
        sql: "SELECT reference FROM venue_enquiries WHERE id = ?",
        timeout: 10_000,
      }, [values.id]);
      if (rows.length !== 1) throw new Error("ENQUIRY_NOT_STORED");
      await connection.commit();
      return Response.json({ reference: rows[0].reference, saved: true }, { status: 201, headers: noCache });
    } catch (error) {
      try { await connection.rollback(); } catch { /* Preserve the original failure. */ }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    // SQL error messages can contain submitted details. Log only a bounded code.
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "STORAGE_UNAVAILABLE";
    console.error("Venue enquiry save failed:", /^[A-Z0-9_]{1,64}$/.test(code) ? code : "STORAGE_UNAVAILABLE");
    return Response.json({ error: "We couldn’t save your enquiry just now. Your details are still in the form. Try again, or email jollynailprinting@gmail.com." }, { status: 503, headers: noCache });
  }
}
