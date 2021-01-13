/* eslint-disable @typescript-eslint/no-floating-promises */
import request from 'supertest';
import passportStub from 'passport-stub';
import app from '~/server';

describe('/login', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({ username: 'test-user' });
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall();
  });

  it('include a link to login', (done) => {
    request(app)
      .get('/login')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a href="\/auth\/github"/)
      .expect(200, done);
  });

  it('show user name when logged in', (done) => {
    request(app)
      .get('/login')
      .expect(/test-user/)
      .expect(200, done);
  });
});

describe('/logout', () => {
  it('redirect when accessing to /logout', (done) => {
    request(app).get('/logout').expect('Location', '/').expect(302, done);
  });
});
