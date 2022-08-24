const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

const randomPassword = require('generate-password');

const { faker } = require('@faker-js/faker');

const CarbonCertificateStatusEnum = {
  1: 'available',
  2: 'owned',
  3: 'transferred',
};

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

export async function seed(appDataSource = AppDataSource) {
  await appDataSource.initialize();

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

  const userArr = [];
  for (let i = 0; i < 10; i++) {
    const password = randomPassword.generate({
      length: 10,
      numbers: true,
    });
    const email = faker.internet.email();
    const name = faker.name.fullName();
    const passwordHash = await bcrypt.hash(password, 10);
    const row = `('${email}', '${name.replace(
      /'|\(/g,
      '',
    )}', '${passwordHash}')`;
    userArr.push(row);
  }

  const strUsers = userArr.join(', ');

  await appDataSource.query(`INSERT INTO "user" ("email", "name", "password")
                               VALUES ${strUsers}`);

  const randomEnumValue = (enumeration) => {
    const values = Object.keys(enumeration);
    const enumKey = values[Math.floor(Math.random() * values.length)];
    return enumeration[enumKey];
  };

  const certificateArr = [];

  const owners = await appDataSource.query(`SELECT "id"
                                              FROM "user"
    `);

  for (let i = 0; i < 100; i++) {
    const country = faker.address.country();
    const status = randomEnumValue(CarbonCertificateStatusEnum);

    const row =
      i > 4
        ? `('${country.replace(/'|\(/g, '')}', '${status}', NULL)`
        : `('${country.replace(/'|\(/g, '')}', '${status}', '${owners[i].id}')`;
    certificateArr.push(row);
  }
  const strCertificate = certificateArr.join(', ');

  await appDataSource.query(`INSERT INTO "carbon_certificate" ("country", "status", "ownerId")
                               VALUES ${strCertificate};`);
}

seed();
