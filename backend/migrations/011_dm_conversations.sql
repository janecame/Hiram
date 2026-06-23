-- Allow conversations without an item (user-to-user direct messages)
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_item_id_borrower_id_lister_id_key;

ALTER TABLE conversations
  ALTER COLUMN item_id DROP NOT NULL,
  ALTER COLUMN item_id DROP DEFAULT;

-- For DMs (no item): one thread per user pair regardless of direction
-- For item chats: still unique per (item, borrower, lister)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_dm_unique
  ON conversations (borrower_id, lister_id)
  WHERE item_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_item_unique
  ON conversations (item_id, borrower_id, lister_id)
  WHERE item_id IS NOT NULL;
