CREATE TABLE IF NOT EXISTS iex.news (
  news_id integer NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz NULL,
  active_at timestamptz NULL,
  author_id integer NULL,
  summary text NOT NULL,
  body text NOT NULL,
  CONSTRAINT news_pk PRIMARY KEY (news_id),
  CONSTRAINT comment_author_fk FOREIGN KEY (author_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS iex.user_news (
  user_id integer NOT NULL,
  news_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  liked boolean NOT NULL DEFAULT false,
  CONSTRAINT user_news_pk PRIMARY KEY (user_id, news_id),
  CONSTRAINT user_news_user_fk FOREIGN KEY (user_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT user_news_news_fk FOREIGN KEY (news_id)
    REFERENCES iex.news (news_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
