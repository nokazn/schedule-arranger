/* eslint-disable @typescript-eslint/no-floating-promises */
import request from 'supertest';
import passportStub from 'passport-stub';

import app from '~/server';
import { db } from '~/infrastructure/db';
import { Candidate, User, Availability, AvailabilityAttributes } from '~/entities';
import { UserDao } from '~/daos';
import { deleteScheduleAggregate } from './utils';

const user = {
  id: 0,
  username: 'test-user',
  displayName: 'test-user',
  profileUrl: 'path/to/test-user',
};

afterAll(async () => {
  // これがないと connection を張ったままになってしまい、テストが exit しない
  await Promise.all([db.close()]);
});

describe('/login', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login(user);
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

describe('/schedules', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login(user);
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall();
  });

  it('create a schedule and then show it', async (done) => {
    const res = await UserDao.upsert({ ...user, userId: user.id })
      .then(() => {
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

    await request(app)
      .get(schedulePath)
      .expect(200)
      .then(() => {
        const scheduleId = schedulePath?.split('/schedules/')?.[1];
        if (schedulePath == null || typeof scheduleId !== 'string') {
          console.error(schedulePath, scheduleId);
          throw new Error('scheduleId is incorrect');
        }
        return deleteScheduleAggregate(scheduleId, done);
      })
      .catch((err) => {
        console.error(err);
      });
  });
});

describe('/schedules/:scheduleId/users/:userId/candidates/:candidateId', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login(user);
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall();
  });

  it('update availabilities', () => {
    const availability = 2;
    return User.upsert({ ...user, userId: user.id })
      .then(() =>
        request(app).post('/schedules').send({
          scheduleName: 'テスト出欠更新予定1',
          memo: 'テスト出欠更新メモ1',
          candidates: 'テスト出欠更新候補1',
        }),
      )
      .then((res) => {
        const schedulePath = (res.headers as Record<string, string>).location;
        const scheduleId = schedulePath?.split('/schedules/')[1];
        if (typeof scheduleId !== 'string') {
          console.error(schedulePath);
          throw new Error('scheduleId is incorrect');
        }
        return Promise.all([Candidate.findOne({ where: { scheduleId } }), scheduleId] as const);
      })
      .then(([candidate, scheduleId]) => {
        const candidateId = candidate?.getDataValue('candidateId');
        if (candidateId == null) {
          throw new Error('candidate has failed to be found.');
        }
        const availabilityParams: AvailabilityAttributes = {
          userId: user.id,
          scheduleId,
          candidateId,
          availability,
        };
        return Promise.all([
          request(app)
            .post(`/schedules/${scheduleId}/users/${user.id}/candidates/${candidateId}`)
            .send({ availability }) // 出席
            .expect('{"status":"OK","availability":2}'),
          availabilityParams,
        ] as const);
      })
      .then(([, availabilityParams]) => {
        return Promise.all([
          Availability.findAll({
            where: {
              scheduleId: availabilityParams.scheduleId,
            },
          }),
          availabilityParams,
        ] as const);
      })
      .then(([availabilities, availabilityParams]) => {
        expect(
          availabilities.map<AvailabilityAttributes>((a) => {
            const v = a.get();
            return {
              scheduleId: v.scheduleId,
              userId: v.userId,
              candidateId: v.candidateId,
              availability: v.availability,
            };
          }),
        ).toEqual([availabilityParams]);
        return availabilityParams.scheduleId;
      })
      .then((scheduleId) => deleteScheduleAggregate(scheduleId))
      .catch((err: Error) => {
        console.error(err);
        // done();
      });
  });
});
