CREATE TABLE IF NOT EXISTS iex.user_activity (
  user_id integer NOT NULL,
  activity_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  liked boolean NOT NULL DEFAULT false,
  CONSTRAINT user_activity_pk PRIMARY KEY (user_id, activity_id),
  CONSTRAINT user_activity_user_fk FOREIGN KEY (user_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
