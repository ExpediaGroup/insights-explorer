ALTER TABLE iex.user ADD "team" text NULL;
ALTER TABLE iex.user ADD "skills" text[] NULL;
ALTER TABLE iex.user ADD "default_template" integer NULL;

ALTER TABLE iex."user" ADD CONSTRAINT user_template_fk FOREIGN KEY (default_template)
    REFERENCES iex.insight (insight_id)
    ON UPDATE CASCADE ON DELETE CASCADE;
