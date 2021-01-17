import { Router, Request, Response } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';
import type { Profile } from 'passport';

import { User, ScheduleAttributes, CandidateAttributes, AvailabilityAttributes } from '~/entities';
import { ScheduleDao, CandidateDao, AvailabilityDao } from '~/daos';
import { authEnsurer } from '~/services/auth';
import logger from '~/shared/logger';

type Availability = AvailabilityAttributes['availability'];
type UserInAvailabilities = {
  isSelf: boolean;
  userId: number;
  username: string;
};

type CreationBody = {
  scheduleName: string;
  memo: string;
  candidates: string;
};

type ScheduleDetailParam = {
  scheduleId: string;
};

type ScheduleDetailRenderOptions = {
  user: Profile | undefined;
  schedule: ScheduleAttributes;
  candidates: CandidateAttributes[];
  users: UserInAvailabilities[];
  availabilityMapMap: Map<number, Map<number, Availability>>;
};

const router = Router();
const { UNAUTHORIZED, NOT_FOUND, INTERNAL_SERVER_ERROR } = httpStatusCodes;

router.get('/new', authEnsurer, (req, res) => {
  res.render('new', {
    user: req.user,
  });
});

router.post('/', authEnsurer, (req: Request<{}, {}, CreationBody>, res, next) => {
  const createdBy = parseInt(req.user?.id ?? '', 10);
  if (req.user == null || Number.isNaN(createdBy)) {
    logger.error(req.user);
    next(createErrors(UNAUTHORIZED));
    return;
  }
  ScheduleDao.add({
    scheduleName: req.body.scheduleName.slice(0, 255) || '(名称未設定)',
    memo: req.body.memo,
    createdBy,
  })
    .then((schedule) => {
      const candidates = req.body.candidates
        .trim()
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s !== '')
        .map((c) => ({
          candidateName: c,
          scheduleId: schedule.scheduleId,
        }));
      return Promise.all([CandidateDao.bulkAdd(candidates), schedule] as const);
    })
    .then(([, schedule]) => {
      res.redirect(`/schedules/${schedule.scheduleId}`);
    })
    .catch((err: Error) => {
      logger.error(err);
      next(createErrors(INTERNAL_SERVER_ERROR));
    });
});

router.get('/:scheduleId', authEnsurer, async (req: Request<ScheduleDetailParam>, res: Response, next) => {
  if (req.user == null) {
    next(createErrors(UNAUTHORIZED));
    return;
  }

  const { scheduleId } = req.params;
  const schedule = await ScheduleDao.getOne({
    include: [
      {
        model: User,
        attributes: ['userId', 'username'],
      },
    ],
    where: { scheduleId },
    order: [['"updatedAt"', 'DESC']],
  }).catch((err) => {
    logger.error(err);
    return undefined;
  });
  if (schedule == null) {
    next(createErrors(NOT_FOUND, `Couldn't find schedule of which id is ${scheduleId}`));
    return;
  }

  const candidates = await CandidateDao.getAll({
    where: { scheduleId },
    order: [['"candidateId"', 'ASC']],
  }).catch((err) => {
    logger.error(err);
    return undefined;
  });
  if (candidates == null) {
    next(createErrors(INTERNAL_SERVER_ERROR));
    return;
  }

  const availabilities = await AvailabilityDao.getAll({
    include: [
      {
        model: User,
        attributes: ['userId', 'username'],
      },
    ],
    where: { scheduleId },
    order: [
      [User, 'username', 'ASC'],
      ['"candidate"Id', 'ASC'],
    ],
  }).catch((err) => {
    logger.error(err);
    return undefined;
  });
  if (availabilities == null) {
    next(createErrors(INTERNAL_SERVER_ERROR));
    return;
  }

  // req.user と availabilities 内の user から users を作成
  const userId = parseInt(req.user.id, 10);
  const userMap = new Map<number, UserInAvailabilities>([
    [
      userId,
      {
        isSelf: true,
        userId,
        username: req.user.username ?? '',
      },
    ],
    ...availabilities.map(
      (a) =>
        [
          a.userId,
          {
            isSelf: a.userId === userId,
            userId: a.userId,
            // @ts-expect-errors
            username: a.user.username as string,
          },
        ] as const,
    ),
  ]);
  const users = [...userMap.values()];

  // availabilities から availabilityMapMap を作成
  const availabilityMapMap = new Map<number, Map<number, Availability>>();
  availabilities.forEach((a) => {
    const map = availabilityMapMap.get(a.userId) || new Map<number, Availability>();
    map.set(a.candidateId, a.availability);
    availabilityMapMap.set(a.userId, map);
  });
  // availabilities にない出席情報を補完
  users.forEach((u) => {
    candidates.forEach((c) => {
      const map = availabilityMapMap.get(u.userId) ?? new Map<number, Availability>();
      if (!map.has(c.candidateId)) {
        map.set(c.candidateId, 0);
        availabilityMapMap.set(u.userId, map);
      }
    });
  });

  res.render<ScheduleDetailRenderOptions>('schedule', {
    user: req.user,
    schedule,
    candidates,
    users,
    availabilityMapMap,
  });
});

export default router;
