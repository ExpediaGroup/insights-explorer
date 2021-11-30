CREATE TABLE IF NOT EXISTS iex.draft (
  draft_id integer NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
  draft_key varchar(32) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  insight_id integer NULL,
  created_by_user_id integer NOT NULL,
  draft_data jsonb NOT NULL,
  CONSTRAINT draft_pk PRIMARY KEY (draft_id),
  CONSTRAINT draft_key_un UNIQUE (draft_key),
  CONSTRAINT draft_insight_fk FOREIGN KEY (insight_id)
    REFERENCES iex.insight (insight_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT draft_user_fk FOREIGN KEY (created_by_user_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);
