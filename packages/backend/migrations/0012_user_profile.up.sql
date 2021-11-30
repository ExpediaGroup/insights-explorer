ALTER TABLE iex.user ADD "chat_handle" text NULL;
ALTER TABLE iex.user ADD "location" text NULL;
ALTER TABLE iex.user ADD "title" text NULL;
ALTER TABLE iex.user ADD "bio" text NULL;
ALTER TABLE iex.user ADD "readme" text NULL;

ALTER TABLE iex."user" DROP CONSTRAINT user_un_ldap;
ALTER TABLE iex."user" DROP COLUMN ldap_dn;

ALTER TABLE iex."user" ADD CONSTRAINT user_email_un UNIQUE (email);

CREATE TABLE IF NOT EXISTS iex.user_follow (
  user_id integer NOT NULL,
  followed_user_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz NULL,
  CONSTRAINT user_follow_pk PRIMARY KEY (user_id, followed_user_id),
  CONSTRAINT user_follow_user_fk FOREIGN KEY (user_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT user_follow_followed_user_fk FOREIGN KEY (followed_user_id)
    REFERENCES iex.user (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
