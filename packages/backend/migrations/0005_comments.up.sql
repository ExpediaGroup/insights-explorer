CREATE TABLE IF NOT EXISTS iex.comment (
  comment_id integer NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz NULL,
  author_id integer NOT NULL,
  insight_id integer NOT NULL,
  parent_comment_id integer NULL,
  comment_text text NOT NULL,
  is_edited boolean NOT NULL DEFAULT false,
  kudos integer NOT NULL DEFAULT 0,
  CONSTRAINT comment_pk PRIMARY KEY (comment_id),
  CONSTRAINT comment_insight_fk FOREIGN KEY (insight_id)
    REFERENCES iex.insight (insight_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT comment_author_fk FOREIGN KEY (author_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT comment_parent_comment_fk FOREIGN KEY (parent_comment_id)
    REFERENCES iex.comment (comment_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
