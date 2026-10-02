import type { RowDataPacket } from "mysql2";

// The versioned SQL schema is deploy/migrations/001-venue-enquiries.sql.
// created_at retains the source's Unix epoch milliseconds, not local SQL time.
export interface VenueEnquiryRow extends RowDataPacket {
  id: string;
  reference: string;
  name: string;
  organisation: string;
  email: string;
  phone: string;
  venue_type: string;
  city: string;
  message: string;
  contact_consent: number;
  created_at: string;
}
