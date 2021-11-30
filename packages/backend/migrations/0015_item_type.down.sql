ALTER TABLE iex.insight DROP COLUMN "item_type";
ALTER TABLE iex.insight ADD is_template boolean NOT NULL DEFAULT false;
