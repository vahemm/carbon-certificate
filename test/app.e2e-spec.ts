import { Test } from '@nestjs/testing';
import { Connection } from 'typeorm';
import * as request from 'supertest';
import { ApplicationConfig } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from '../src/app.module';
import User from '../src/users/user.entity';
import { AuthenticationService } from '../src/authentication/authentication.service';
import * as bcrypt from 'bcrypt';

describe('Carbon Certificate App', () => {
  let connection: Connection;
  let httpServer: any;
  let app: any;
  let authenticationService: AuthenticationService;

  beforeAll(async () => {
    async function configure(app: INestApplication) {
      useContainer(app.select(AppModule), { fallbackOnErrors: true });
      app.get(ApplicationConfig);
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    authenticationService = moduleRef.get<AuthenticationService>(
      AuthenticationService,
    );

    app = moduleRef.createNestApplication();
    await configure(app);
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    connection = await app.get(Connection);

    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    if (connection.isConnected) {
      await connection.close();
    }
  });

  describe('AuthenticationController (e2e)', () => {
    describe('AuthenticationController (e2e) /authentication/register', () => {
      it('Should throw not valid email error', async () => {
        const baseUrl = '/authentication/register';
        const data = {
          email: 'not-email',
          name: 'username',
          password: 'password',
        };

        const response = await request(httpServer).post(baseUrl).send(data);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual(['email must be an email']);
      });

      it('Should throw not valid name error', async () => {
        const baseUrl = '/authentication/register';
        const data = {
          email: 'test@email.com',
          name: 'testName',
          password: 'pass',
        };

        const response = await request(httpServer).post(baseUrl).send(data);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual([
          'password must be longer than or equal to 7 characters',
        ]);
      });

      it('Should throw not valid password error', async () => {
        const baseUrl = '/authentication/register';
        const data = {
          email: 'test@email.com',
          name: '',
          password: 'password',
        };

        const response = await request(httpServer).post(baseUrl).send(data);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual(['name should not be empty']);
      });

      it('Success with valid params', async () => {
        const baseUrl = '/authentication/register';
        const data = {
          email: 'test@email.com',
          name: 'username',
          password: 'password',
        };

        const response = await request(httpServer).post(baseUrl).send(data);

        await connection.getRepository(User).delete({ id: response.body.id });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          email: data.email,
          name: data.name,
        });
      });
    });

    describe('AuthenticationController (e2e) /authentication/log-in', () => {
      it('Should throw  wrong credentials provided error', async () => {
        const baseUrl = '/authentication/log-in';
        const password = await bcrypt.hash('password', 10);
        const data = {
          email: 'test@email.com',
          name: 'username',
          password,
        };

        const user = await connection.getRepository(User).save(data);

        const response = await request(httpServer).post(baseUrl).send({
          email: 'test@email.com',
          password: 'wrongPassword',
        });

        await connection.getRepository(User).delete({ id: user.id });
        console.log('response.body ', response.body);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual('Wrong credentials provided');
      });

      it('Success with valid params', async () => {
        const baseUrl = '/authentication/log-in';
        const password = await bcrypt.hash('password', 10);
        const data = {
          email: 'test@email.com',
          name: 'username',
          password,
        };

        const user = await connection.getRepository(User).save(data);

        const response = await request(httpServer).post(baseUrl).send({
          email: 'test@email.com',
          password: 'password',
        });

        await connection.getRepository(User).delete({ id: user.id });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });
    });
  });
  describe('CarbonCertificateController (e2e)', () => {
    describe('AuthenticationController (e2e) /carbon-certificates/my', () => {
      it('Should throw unauthorized error', async () => {
        const baseUrl = '/carbon-certificates/my';

        const expectedData = { statusCode: 401, message: 'Unauthorized' };

        const response = await request(httpServer).get(baseUrl).send();

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject(expectedData);
      });

      it('Successfully get my carbon certificates', async () => {
        const baseUrl = '/carbon-certificates/my';
        const data = {
          email: 'test1@mail.com',
          name: 'username',
          password: 'password1',
        };

        const expectedData = [
          {
            id: 1,
            country: 'France',
            status: 'owned',
            owner: { id: 1, email: 'test1@mail.com', name: 'name1' },
          },
        ];

        const activeUser = await connection
          .getRepository(User)
          .findOne({ where: { email: data.email } });

        const tokenResponse = await authenticationService.authTokenFor(
          activeUser,
        );

        const response = await request(httpServer)
          .get(baseUrl)
          .auth(tokenResponse, { type: 'bearer' })
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(expectedData);
      });
    });
    describe('AuthenticationController (e2e) /carbon-certificates/my', () => {
      it('Should throw unauthorized error', async () => {
        const baseUrl = '/carbon-certificates/ownerless';

        const expectedData = { statusCode: 401, message: 'Unauthorized' };

        const response = await request(httpServer).get(baseUrl).send();

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject(expectedData);
      });
      it('Successfully get my carbon certificates', async () => {
        const baseUrl = '/carbon-certificates/ownerless';
        const data = {
          email: 'test1@mail.com',
          name: 'username',
          password: 'password1',
        };

        const expectedData = [
          { id: 3, country: 'Spain', status: 'available', owner: null },
        ];

        const activeUser = await connection
          .getRepository(User)
          .findOne({ where: { email: data.email } });

        const tokenResponse = await authenticationService.authTokenFor(
          activeUser,
        );

        const response = await request(httpServer)
          .get(baseUrl)
          .auth(tokenResponse, { type: 'bearer' })
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject(expectedData);
      });
    });
  });
});
