CREATE TABLE IF NOT EXISTS iex.repository_type (
  repository_type_id smallint NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
  repository_type_name varchar(16) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT repository_type_pk PRIMARY KEY (repository_type_id),
  CONSTRAINT repository_type_un UNIQUE (repository_type_name)
);

CREATE TABLE IF NOT EXISTS iex.insight (
  insight_id integer NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1000000 INCREMENT BY 1),
  external_id varchar(256) NOT NULL,
  insight_name varchar(256) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  repository_type_id smallint NOT NULL,
  repository_data jsonb NOT NULL,
  CONSTRAINT insight_pk PRIMARY KEY (insight_id),
  CONSTRAINT insight_un UNIQUE (external_id),
  CONSTRAINT insight_un_name UNIQUE (insight_name),
  FOREIGN KEY (repository_type_id) REFERENCES iex.repository_type (repository_type_id)
);

INSERT INTO iex.repository_type (repository_type_name)
VALUES('github');
