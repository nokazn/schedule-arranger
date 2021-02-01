/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-floating-promises */
import request from 'supertest-session';
import passportStub from 'passport-stub';
import { JSDOM } from 'jsdom';

import app from '~/server';
import { syncDb } from '~/pre-start/syncDb';
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

const getCsrfToken = async (path: string = '/schedules/new'): Promise<[string | undefined, string[]]> => {
  const res = await request(app)
    .get(path)
    .catch((err: Error) => {
      console.error(err);
      return undefined;
    });
  if (res == null) {
    return [undefined, []];
  }
  const input = new JSDOM(res.text).window.document.getElementsByName('_csrf')[0] as HTMLInputElement | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return [input?.value, res.headers['set-cookie'] as string[]];
};

beforeAll(async () => {
  await syncDb();
});

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
      .expect(/<a class="btn btn-primary my-3" href="\/auth\/github"/)
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
    const schedule = {
      scheduleName: 'schedule1',
      memo: 'memomemo\nmemomemo',
      candidates: 'candidate1\ncandidate2\ncandidate3\n\n',
    };
    const [_csrf, cookies] = await getCsrfToken();
    const res = await UserDao.upsert({ ...user, userId: user.id })
      .then(() => {
        return request(app)
          .post('/schedules')
          .set('Cookie', cookies)
          .send({
            ...schedule,
            _csrf,
          })
          .expect('Location', /schedules/)
          .expect(302);
      })
      .catch((err: Error) => {
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
      .catch((err: Error) => {
        console.error(err);
        throw err;
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

  it('update availabilities', async () => {
    const schedule = {
      scheduleName: 'テスト出欠更新予定1',
      memo: 'テスト出欠更新メモ1',
      candidates: 'テスト出欠更新候補1',
    };
    const availability = 2;
    const [_csrf, cookies] = await getCsrfToken();
    return User.upsert({ ...user, userId: user.id })
      .then(() =>
        request(app)
          .post('/schedules')
          .set('Cookie', cookies)
          .send({
            ...schedule,
            _csrf,
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
      .then(async ([candidate, scheduleId]) => {
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
            .set('Cookie', cookies)
            .send({
              availability, // 出席
              _csrf,
            })
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
        throw err;
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

  it('update schedule & add candidates', async () => {
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

    const [_csrf, cookies] = await getCsrfToken();
    User.upsert({ ...user, userId: user.id })
      .then(() =>
        request(app)
          .post('/schedules')
          .set('Cookie', cookies)
          .send({
            ...schedule1,
            _csrf,
          }),
      )
      .then((res) => {
        const schedulePath = (res.headers as Record<string, string>).location;
        const scheduleId = schedulePath?.split('/schedules/')[1];
        if (typeof scheduleId !== 'string') {
          console.error(schedulePath);
          throw new Error('scheduleId is incorrect');
        }
        return Promise.all([
          request(app)
            .post(`/schedules/${scheduleId}?edit=1`)
            .set('Cookie', cookies)
            .send({
              ...schedule2,
              _csrf,
            }),
          scheduleId,
        ]);
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
      .catch((err: Error) => {
        console.error(err);
        throw err;
      });
  });
});

describe('/schedules/:scheduleId?delete=1', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login(user);
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall();
  });

  it('delete schedules and their related data', async () => {
    const schedule = {
      scheduleName: 'テストコメント更新予定1',
      memo: 'テストコメント更新メモ1',
      candidates: 'テストコメント更新候補1',
    };
    const comment = 'test comment';
    const availability = 2;
    const [_csrf, cookies] = await getCsrfToken();
    return User.upsert({ ...user, userId: user.id })
      .then(() =>
        request(app)
          .post('/schedules')
          .set('Cookie', cookies)
          .send({
            ...schedule,
            _csrf,
          }),
      )
      .then((res) => {
        const schedulePath = (res.headers as Record<string, string>).location;
        const scheduleId = schedulePath?.split('/schedules/')[1];
        if (typeof scheduleId !== 'string') {
          console.error(schedulePath);
          throw new Error('scheduleId is incorrect');
        }
        return Promise.all([
          Candidate.findOne({ where: { scheduleId } }),
          request(app)
            .post(`/schedules/${scheduleId}/users/${user.id}/comments`)
            .set('Cookie', cookies)
            .send({
              comment,
              _csrf,
            })
            .expect(`{"status":"OK","comment":"${comment}"}`),
          scheduleId,
        ] as const);
      })
      .then(([candidate, , scheduleId]) => {
        if (candidate == null) {
          throw new Error("couldn't get candidate.");
        }
        return Promise.all([
          request(app)
            .post(`/schedules/${scheduleId}/users/${user.id}/candidates/${candidate.getDataValue('candidateId')}`)
            .set('Cookie', cookies)
            .send({
              availability,
              _csrf,
            }),
          scheduleId,
        ] as const);
      })
      .then(([, scheduleId]) =>
        Promise.all([
          request(app).post(`/schedules/${scheduleId}?delete=1`).set('Cookie', cookies).send({
            _csrf,
          }),
          scheduleId,
        ]),
      )
      .then(([, scheduleId]) =>
        Promise.all([
          Comment.findAll({ where: { scheduleId } }),
          Availability.findAll({ where: { scheduleId } }),
          Candidate.findAll({ where: { scheduleId } }),
          Schedule.findByPk(scheduleId),
        ] as const),
      )
      .then(([comments, availabilities, candidates, foundSchedule]) => {
        expect(comments.length).toBe(0);
        expect(availabilities.length).toBe(0);
        expect(candidates.length).toBe(0);
        expect(foundSchedule).toBeNull();
      })
      .catch((err: Error) => {
        console.error(err);
        throw err;
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

  it('update comments', async () => {
    const schedule = {
      scheduleName: 'テストコメント更新予定1',
      memo: 'テストコメント更新メモ1',
      candidates: 'テストコメント更新候補1',
    };
    const comment = 'test comment';
    const [_csrf, cookies] = await getCsrfToken();
    return User.upsert({ ...user, userId: user.id })
      .then(() =>
        request(app)
          .post('/schedules')
          .set('Cookie', cookies)
          .send({
            ...schedule,
            _csrf,
          }),
      )
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
            .set('Cookie', cookies)
            .send({
              comment,
              _csrf,
            })
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
        throw err;
      });
  });
});
