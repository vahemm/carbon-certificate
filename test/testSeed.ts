const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_TEST_DB,
});

async function testSeed(appDataSource = AppDataSource) {
  await appDataSource.initialize();

  const passwordHash1 = await bcrypt.hash('password1', 10);
  const passwordHash2 = await bcrypt.hash('password2', 10);

  await appDataSource.query(
    ` ALTER TABLE IF EXISTS "carbon_certificate" DROP CONSTRAINT IF EXISTS "FK_1ec7f1a2274214dbe841bd06bf9";`,
  );
  await appDataSource.query(` DROP TABLE IF EXISTS "carbon_certificate";`);
  await appDataSource.query(
    `DROP TYPE IF EXISTS "public"."carbon_certificate_status_enum";`,
  );
  await appDataSource.query(`DROP TABLE IF EXISTS "user";`);

  await appDataSource.query(`
        CREATE TABLE "user"
        (
            "id"       SERIAL            NOT NULL,
            "email"    character varying NOT NULL,
            "name"     character varying NOT NULL,
            "password" character varying NOT NULL,
            CONSTRAINT "UQ_e81dbf83660d7c3a3fd044b1481" UNIQUE ("email"),
            CONSTRAINT "PK_059472382ebcb0fbeef863ad777" PRIMARY KEY ("id")
        );
        CREATE TYPE "public"."carbon_certificate_status_enum" AS ENUM('available', 'owned', 'transferred');
        CREATE TABLE "carbon_certificate"
        (
            "id"      SERIAL                                    NOT NULL,
            "country" character varying                         NOT NULL,
            "status"  "public"."carbon_certificate_status_enum" NOT NULL,
            "ownerId" integer,
            CONSTRAINT "PK_d27468ee8ba0127dee0c7aba53d" PRIMARY KEY ("id")
        );
        ALTER TABLE "carbon_certificate"
            ADD CONSTRAINT "FK_1ec7f1a2274214dbe841bd06bf9" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

  await appDataSource.query(`INSERT INTO "user" ("email", "name", "password")
                               VALUES ('test1@mail.com', 'name1', '${passwordHash1}'),
                                      ('test2@mail.com', 'name2', '${passwordHash2}'); `);

  const owners = await appDataSource.query(`SELECT "id"
                                              FROM "user";`);

  await appDataSource.query(`INSERT INTO "carbon_certificate" ("country", "status", "ownerId")
                               VALUES ('France', 'owned', '${owners[0].id}'),
                                      ('England', 'owned', '${owners[1].id}'),
                                      ('Spain', 'available', NULL);`);
}

testSeed();
