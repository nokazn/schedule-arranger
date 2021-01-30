import { Router, Request } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';
import type { Profile } from 'passport';

import { ScheduleDao, CandidateDao } from '~/daos';
import { authEnsurer } from '~/services/auth';
import csrfProtection from '~/services/csrf';
import { deleteScheduleAggregate } from '~/routes/utils';
import logger from '~/shared/logger';
import { ScheduleIdParam, isMine, sliceScheduleName, parseCandidateNames, createCandidatesAndRedirect } from './index';
import type { ScheduleAttributes, CandidateAttributes } from '~/entities';

type Body = {
  scheduleName: string;
  memo: string;
  candidates: string;
};

type Query = {
  edit?: string;
  delete?: string;
};

type RenderOptions = {
  user: Profile | undefined;
  schedule: ScheduleAttributes;
  candidates: CandidateAttributes[];
  csrfToken: string;
};

const router = Router();
const { BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, INTERNAL_SERVER_ERROR } = httpStatusCodes;

router.get('/:scheduleId/edit', authEnsurer, csrfProtection, async (req: Request<ScheduleIdParam>, res, next) => {
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
      res.render<RenderOptions>('edit', {
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
  async (req: Request<ScheduleIdParam, {}, Body, Query>, res, next) => {
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
