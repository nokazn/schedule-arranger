import { Router, Request, Response } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';
import type { Profile } from 'passport';

import { User } from '~/entities';
import { ScheduleDao, CandidateDao, AvailabilityDao, CommentDao } from '~/daos';
import { authEnsurer } from '~/services/auth';
import csrfProtection from '~/services/csrf';
import logger from '~/shared/logger';
import type {
  UserAttributes,
  ScheduleAttributes,
  CandidateAttributes,
  AvailabilityAttributes,
  CommentAttributes,
} from '~/entities';
import type { ScheduleIdParam } from './index';

type Availability = AvailabilityAttributes['availability'];
type UserId = UserAttributes['userId'];
type CandidateId = CandidateAttributes['candidateId'];
type UserInAvailabilities = {
  isSelf: boolean;
  userId: UserId;
  username: string;
};
type AvailabilityMap = Map<CandidateId, Availability>;

type RenderOptions = {
  user: Profile | undefined;
  csrfToken: string;
  schedule: ScheduleAttributes;
  candidates: CandidateAttributes[];
  users: UserInAvailabilities[];
  availabilityMapMap: Map<number, Map<number, Availability>>;
  commentMap: Map<CommentAttributes['userId'], CommentAttributes>;
};

const router = Router();
const { UNAUTHORIZED, NOT_FOUND, INTERNAL_SERVER_ERROR } = httpStatusCodes;

router.get('/:scheduleId', authEnsurer, csrfProtection, async (req: Request<ScheduleIdParam>, res: Response, next) => {
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

  res.render<RenderOptions>('schedule', {
    user: req.user,
    csrfToken: req.csrfToken(),
    schedule,
    candidates,
    users,
    availabilityMapMap,
    commentMap,
  });
});

export default router;
