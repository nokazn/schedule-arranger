import { Router, Request, Response } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';
import type { Profile } from 'passport';

import { User } from '~/entities';
import type {
  UserAttributes,
  ScheduleAttributes,
  CandidateAttributes,
  AvailabilityAttributes,
  CommentAttributes,
} from '~/entities';
import { ScheduleDao, CandidateDao, AvailabilityDao, CommentDao } from '~/daos';
import { authEnsurer } from '~/services/auth';
import csrfProtection from '~/services/csrf';
import logger from '~/shared/logger';
import { deleteScheduleAggregate } from '~/routes/utils';

type Availability = AvailabilityAttributes['availability'];
type UserId = UserAttributes['userId'];
type CandidateId = CandidateAttributes['candidateId'];
type UserInAvailabilities = {
  isSelf: boolean;
  userId: UserId;
  username: string;
};
type AvailabilityMap = Map<CandidateId, Availability>;

type CreationBody = {
  scheduleName: string;
  memo: string;
  candidates: string;
};

type EditQuery = {
  edit?: string;
  delete?: string;
};

type ScheduleDetailParam = {
  scheduleId: string;
};

type NewScheduleRenderOptions = {
  user: Express.User | undefined;
  csrfToken: string;
};
type ScheduleDetailRenderOptions = {
  user: Profile | undefined;
  schedule: ScheduleAttributes;
  candidates: CandidateAttributes[];
  users: UserInAvailabilities[];
  // TODO: 型定義
  availabilityMapMap: Map<number, Map<number, Availability>>;
  commentMap: Map<CommentAttributes['userId'], CommentAttributes>;
};
type ScheduleEditRenderOptions = {
  user: Profile | undefined;
  schedule: ScheduleAttributes;
  candidates: CandidateAttributes[];
  csrfToken: string;
};

const router = Router();
const { BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, INTERNAL_SERVER_ERROR } = httpStatusCodes;

// ------------------------------ utilities ------------------------------

const sliceScheduleName = (scheduleName: string | undefined | null) => scheduleName?.slice(0, 255) || '(名称未設定)';

const parseCandidateNames = (req: Request<{}, {}, Partial<CreationBody>>): string[] | undefined => {
  return req.body.candidates
    ?.trim()
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s !== '');
};

const createCandidatesAndRedirect = (
  candidateNames: string[],
  scheduleId: string,
  res: Response,
): Promise<CandidateAttributes[]> => {
  const candidates = candidateNames.map((c) => ({
    candidateName: c,
    scheduleId,
  }));
  return CandidateDao.bulkAdd(candidates).then((c) => {
    res.redirect(`/schedules/${scheduleId}`);
    return c;
  });
};

const isMine = (schedule: ScheduleAttributes, req: Request<any, any, any, any>) => {
  return req.user != null && schedule.createdBy === parseInt(req.user.id, 10);
};

// ------------------------------ router ------------------------------

router.get('/new', authEnsurer, csrfProtection, (req, res) => {
  res.render<NewScheduleRenderOptions>('new', {
    user: req.user,
    csrfToken: req.csrfToken(),
  });
});

router.post('/', authEnsurer, csrfProtection, (req: Request<{}, {}, CreationBody>, res, next) => {
  const createdBy = parseInt(req.user?.id ?? '', 10);
  if (req.user == null || Number.isNaN(createdBy)) {
    logger.error(req.user);
    next(createErrors(UNAUTHORIZED));
    return;
  }
  ScheduleDao.add({
    scheduleName: sliceScheduleName(req.body.scheduleName),
    memo: req.body.memo,
    createdBy,
  })
    .then((schedule) => {
      const candidates = parseCandidateNames(req);
      if (candidates != null) {
        return createCandidatesAndRedirect(candidates, schedule.scheduleId, res);
      }
      return Promise.resolve([]);
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
  const userMap = new Map<UserId, UserInAvailabilities>([
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
  const availabilityMapMap = new Map<UserId, AvailabilityMap>();
  availabilities.forEach((a) => {
    const map = availabilityMapMap.get(a.userId) || new Map<CandidateId, Availability>();
    map.set(a.candidateId, a.availability);
    availabilityMapMap.set(a.userId, map);
  });
  // availabilities にない出席情報を補完
  users.forEach((u) => {
    candidates.forEach((c) => {
      const map = availabilityMapMap.get(u.userId) ?? new Map<CandidateId, Availability>();
      if (!map.has(c.candidateId)) {
        map.set(c.candidateId, 0);
        availabilityMapMap.set(u.userId, map);
      }
    });
  });

  const comments = await CommentDao.getAll({ where: { scheduleId: schedule.scheduleId } }).catch((err: Error) => {
    logger.error(err);
    return [] as CommentAttributes[];
  });
  const commentMap = new Map<UserId, CommentAttributes>(comments.map((c) => [c.userId, c]));

  res.render<ScheduleDetailRenderOptions>('schedule', {
    user: req.user,
    schedule,
    candidates,
    users,
    availabilityMapMap,
    commentMap,
  });
});

router.get('/:scheduleId/edit', authEnsurer, csrfProtection, async (req: Request<ScheduleDetailParam>, res, next) => {
  const schedule = await ScheduleDao.getOne({
    where: { scheduleId: req.params.scheduleId },
  }).catch((err: Error) => {
    console.error(err);
    return undefined;
  });

  if (schedule == null) {
    next(createErrors(NOT_FOUND, new Error('指定された予定がありません')));
    return;
  }
  if (!isMine(schedule, req)) {
    next(createErrors(UNAUTHORIZED, new Error('予定する権限がありません')));
    return;
  }

  CandidateDao.getAll({
    where: { scheduleId: schedule.scheduleId },
    order: [['"candidateId', 'ASC']],
  })
    .then((candidates) => {
      res.render<ScheduleEditRenderOptions>('edit', {
        user: req.user,
        schedule,
        candidates,
        csrfToken: req.csrfToken(),
      });
    })
    .catch((err) => {
      console.error(err);
    });
});

router.post(
  '/:scheduleId',
  authEnsurer,
  csrfProtection,
  async (req: Request<ScheduleDetailParam, {}, CreationBody, EditQuery>, res, next) => {
    const { scheduleId } = req.params;
    const schedule = await ScheduleDao.getOne({
      where: { scheduleId },
    }).catch((err) => {
      console.error(err);
      return undefined;
    });

    if (schedule == null) {
      next(createErrors(NOT_FOUND, new Error('指定された予定がありません')));
      return;
    }
    if (!isMine(schedule, req)) {
      next(createErrors(UNAUTHORIZED, new Error('予定する権限がありません')));
      return;
    }
    if (
      (req.query.edit == null || parseInt(req.query.edit, 10) !== 1) &&
      (req.query.delete == null || parseInt(req.query.delete, 10) !== 1)
    ) {
      next(createErrors(BAD_REQUEST, '不正なリクエストです。'));
      return;
    }

    if (req.query.delete != null && parseInt(req.query.delete, 10) === 1) {
      deleteScheduleAggregate(req.params.scheduleId, () => {
        res.redirect('/');
      }).catch((err) => {
        logger.error(err);
        next(createErrors(INTERNAL_SERVER_ERROR));
      });
      return;
    }

    await ScheduleDao.update({
      scheduleId,
      scheduleName: sliceScheduleName(req.body.scheduleName),
      memo: req.body.memo,
      createdBy: parseInt(req.user?.id ?? '', 10),
    }).catch((err: Error) => {
      logger.error(err);
      next(createErrors(INTERNAL_SERVER_ERROR));
    });

    // 追加されてるかチェック
    const candidateNames = parseCandidateNames(req);
    if (candidateNames != null && candidateNames.length > 0) {
      createCandidatesAndRedirect(candidateNames, schedule.scheduleId, res).catch((err: Error) => {
        logger.error(err);
        next(createErrors(INTERNAL_SERVER_ERROR));
      });
    } else {
      res.redirect(`/schedules/${schedule.scheduleId}`);
    }
  },
);

export default router;
