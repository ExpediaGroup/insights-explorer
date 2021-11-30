CREATE TABLE IF NOT EXISTS iex.user (
  user_id int4 NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 500000 INCREMENT BY 1),
  user_name varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  display_name varchar(100) NOT NULL,
  ldap_dn varchar(256) NULL,
  last_login_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz NULL,
  github_personal_access_token bytea NULL,
  current_status varchar(256) NULL,
  CONSTRAINT user_pk PRIMARY KEY (user_id),
  CONSTRAINT user_un UNIQUE (user_name),
  CONSTRAINT user_un_ldap UNIQUE (ldap_dn)
);
