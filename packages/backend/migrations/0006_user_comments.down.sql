DROP TABLE iex.user_comment;

ALTER TABLE iex."comment" ADD kudos integer NOT NULL DEFAULT 0;
