CREATE TABLE IF NOT EXISTS iex.user_insight (
  user_id integer NOT NULL,
  insight_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  liked boolean NOT NULL DEFAULT false,
  CONSTRAINT user_insight_pk PRIMARY KEY (user_id, insight_id),
  CONSTRAINT user_insight_user_fk FOREIGN KEY (user_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT user_insight_insight_fk FOREIGN KEY (insight_id)
    REFERENCES iex.insight (insight_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
