/* eslint-disable @typescript-eslint/no-floating-promises */
import request from 'supertest';
import passportStub from 'passport-stub';

import app from '~/server';
import { db } from '~/infrastructure/db';
import { Candidate, User, Availability, Comment, AvailabilityAttributes, Schedule } from '~/entities';
import { UserDao } from '~/daos';
import { deleteScheduleAggregate } from '~/routes/utils';

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
    const schedule = {
      scheduleName: 'テスト出欠更新予定1',
      memo: 'テスト出欠更新メモ1',
      candidates: 'テスト出欠更新候補1',
    };
    const availability = 2;
    return User.upsert({ ...user, userId: user.id })
      .then(() => request(app).post('/schedules').send(schedule))
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

describe('/schedules/:scheduleId?edit=1', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login(user);
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall();
  });

  it('update schedule & add candidates', () => {
    const schedule1 = {
      scheduleName: 'テストコメント更新予定1',
      memo: 'テストコメント更新メモ1',
      candidates: 'テストコメント更新候補1',
    };
    const schedule2 = {
      scheduleName: 'テストコメント更新予定2',
      memo: 'テストコメント更新メモ2',
      candidates: 'テストコメント更新候補2',
    };

    User.upsert({ ...user, userId: user.id })
      .then(() => request(app).post('/schedules').send(schedule1))
      .then((res) => {
        const schedulePath = (res.headers as Record<string, string>).location;
        const scheduleId = schedulePath?.split('/schedules/')[1];
        if (typeof scheduleId !== 'string') {
          console.error(schedulePath);
          throw new Error('scheduleId is incorrect');
        }
        return Promise.all([request(app).post(`/schedules/${scheduleId}?edit=1`).send(schedule2), scheduleId]);
      })
      .then(([, scheduleId]) =>
        Promise.all([
          Schedule.findByPk(scheduleId),
          Candidate.findAll({
            where: { scheduleId },
            order: [['"candidateId"', 'ASC']],
          }),
        ]),
      )
      .then(([s, c]) => {
        if (s == null || c == null) {
          console.error({ s, c });
          throw new Error('schedules or candidates are incorrect.');
        }
        expect(s.getDataValue('scheduleName')).toBe(schedule2.scheduleName);
        expect(s.getDataValue('memo')).toBe(schedule2.memo);
        expect(c.length).toBe(2);
        expect(c[0].getDataValue('candidateName')).toBe(schedule1.candidates);
        expect(c[1].getDataValue('candidateName')).toBe(schedule2.candidates);
        deleteScheduleAggregate(s.getDataValue('scheduleId'));
      })
      .catch((err) => {
        console.error(err);
      });
  });
});

describe('/schedules/scheduleId/users/:userId/comments', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login(user);
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall();
  });

  it('update comments', () => {
    const schedule = {
      scheduleName: 'テストコメント更新予定1',
      memo: 'テストコメント更新メモ1',
      candidates: 'テストコメント更新候補1',
    };
    const comment = 'test comment';
    return User.upsert({ ...user, userId: user.id })
      .then(() => request(app).post('/schedules').send(schedule))
      .then((res) => {
        const schedulePath = (res.headers as Record<string, string>).location;
        const scheduleId = schedulePath?.split('/schedules/')[1];
        if (typeof scheduleId !== 'string') {
          console.error(schedulePath);
          throw new Error('scheduleId is incorrect');
        }
        return Promise.all([
          request(app)
            .post(`/schedules/${scheduleId}/users/${user.id}/comments`)
            .send({ comment })
            .expect(`{"status":"OK","comment":"${comment}"}`),
          scheduleId,
        ] as const);
      })
      .then(([, scheduleId]) => Promise.all([Comment.findAll({ where: { scheduleId } }), scheduleId] as const))
      .then(([comments, scheduleId]) => {
        expect(comments.length).toBe(1);
        expect(comments[0].getDataValue('comment')).toBe(comment);
        return deleteScheduleAggregate(scheduleId);
      })
      .catch((err: Error) => {
        console.error(err);
      });
  });
});
