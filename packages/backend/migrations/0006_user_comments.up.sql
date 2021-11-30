CREATE TABLE IF NOT EXISTS iex.user_comment (
  user_id integer NOT NULL,
  comment_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  liked boolean NOT NULL DEFAULT false,
  CONSTRAINT user_comment_pk PRIMARY KEY (user_id, comment_id),
  CONSTRAINT user_comment_user_fk FOREIGN KEY (user_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT user_comment_comment_fk FOREIGN KEY (comment_id)
    REFERENCES iex.comment (comment_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE iex."comment" DROP COLUMN kudos;
