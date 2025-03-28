-- AlterTable
CREATE SEQUENCE synsettings_id_seq;
ALTER TABLE "SynSettings" ALTER COLUMN "id" SET DEFAULT nextval('synsettings_id_seq');
ALTER SEQUENCE synsettings_id_seq OWNED BY "SynSettings"."id";
