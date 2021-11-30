ALTER TABLE iex.user DROP COLUMN "team";
ALTER TABLE iex.user DROP COLUMN "skills";
ALTER TABLE iex.user DROP COLUMN "default_template";

ALTER TABLE iex.user DROP CONSTRAINT "user_template_fk";
