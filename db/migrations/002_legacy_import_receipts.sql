CREATE TABLE legacy_import_receipts (
  batch_hash text PRIMARY KEY CHECK (batch_hash ~ '^[a-f0-9]{64}$'),
  user_count integer NOT NULL,
  project_count integer NOT NULL,
  event_count integer NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON legacy_import_receipts FROM PUBLIC;
