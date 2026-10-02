-- Initial setup for a NEW, independent database. Select it in phpMyAdmin first.
-- Never apply this file to the existing website's database.
-- CREATE TABLE IF NOT EXISTS makes initial setup repeatable, not an upgrade.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS venue_enquiries (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  reference CHAR(12) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(120) NOT NULL,
  organisation VARCHAR(180) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(35) NOT NULL,
  venue_type VARCHAR(80) NOT NULL,
  city VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  contact_consent TINYINT UNSIGNED NOT NULL,
  created_at BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Checksum is SHA-256 of the bytes above this ledger comment.
INSERT INTO schema_migrations (version, checksum) VALUES
  ('001-venue-enquiries', '1e446d0c32555d4cc3cd5c0c56ace8abd4635d5490117369197b60c4ec77814e')
ON DUPLICATE KEY UPDATE version = version;

SELECT version, checksum, applied_at FROM schema_migrations
WHERE version = '001-venue-enquiries';
