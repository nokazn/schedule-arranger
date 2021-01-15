/* eslint-disable @typescript-eslint/no-floating-promises */
import request from 'supertest';
import passportStub from 'passport-stub';

import app from '~/server';
import { Candidate, Schedule } from '~/entities';
import { UserDao } from '~/daos';

describe('/login', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({ username: 'test-user' });
  });

  afterAll((done) => {
    passportStub.logout();
    passportStub.uninstall();
    done();
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

describe('/schedules', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({
      id: 0,
      username: 'test-user',
    });
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall();
  });

  it('create a schedule and then show it', async (done) => {
    const res = await UserDao.upsert({
      userId: 0,
      username: 'test-user',
      displayName: 'test-user',
      profileUrl: 'path/to/test-user',
    })
      .then(() => {
        console.info('then');
        return request(app)
          .post('/schedules')
          .send({
            scheduleName: 'schedule1',
            memo: 'memomemo\nmemomemo',
            candidates: 'candidate1\ncandidate2\ncandidate3\n\n',
          })
          .expect('Location', /schedules/)
          .expect(302);
      })
      .catch((err) => {
        console.error(err);
        return undefined;
      });

    if (res == null) {
      done();
      return;
    }
    const schedulePath = (res.headers as Record<string, string>).location;
    if (typeof schedulePath !== 'string') {
      console.error('schedulePath is incorrect', schedulePath);
      done();
      return;
    }

    request(app)
      .get(schedulePath)
      .expect(200)
      .then(() => {
        const scheduleId = schedulePath?.split('/schedules/')?.[1];
        if (schedulePath == null || typeof scheduleId !== 'string') {
          console.error(schedulePath, scheduleId);
          throw new Error('scheduleId is incorrect');
        }
        console.info('then1');
        return Candidate.findAll({ where: { scheduleId } })
          .then((candidates) => Promise.all(candidates.map((c) => c.destroy())))
          .then(() => Schedule.findByPk(scheduleId))
          .then((s) => s?.destroy())
          .then(() => {
            console.info('then2');
          });
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        console.log('finnaly');
        done();
      });
  });
});
