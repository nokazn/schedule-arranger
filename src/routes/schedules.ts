import { Router, Request, Response } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';

import { User, ScheduleAttributes, CandidateAttributes } from '~/entities';
import { ScheduleDao, CandidateDao } from '~/daos';
import { authEnsurer } from '~/services/auth';
import logger from '~/shared/logger';

type CreationBody = {
  scheduleName: string;
  memo: string;
  candidates: string;
};

type ScheduleDetailParam = {
  scheduleId: string;
};

type ScheduleDetailResponse = {
  // TODO: user型
  user: unknown[];
  schedule: ScheduleAttributes;
  candidates: CandidateAttributes[];
  users: unknown[];
};

const router = Router();
const { UNAUTHORIZED, NOT_FOUND, INTERNAL_SERVER_ERROR } = httpStatusCodes;

router.get('/new', authEnsurer, (req, res) => {
  res.render('new', {
    user: req.user,
  });
});

router.post('/', authEnsurer, (req: Request<{}, {}, CreationBody>, res, next) => {
  // @ts-expect-error
  const createdBy = req.user?.id as number;
  if (createdBy == null) {
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

router.get(
  '/:scheduleId',
  authEnsurer,
  async (req: Request<ScheduleDetailParam>, res: Response<ScheduleDetailResponse>, next) => {
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

    CandidateDao.getAll({
      where: { scheduleId },
      order: [['"candidateId"', 'ASC']],
    })
      .then((candidates) => {
        res.render('schedule', {
          user: req.user,
          schedule,
          candidates,
          users: [req.user],
        });
      })
      .catch((err) => {
        logger.error(err);
        next(err);
      });
  },
);

export default router;
