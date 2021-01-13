import { Router, Request } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';

import { ScheduleDao, CandidateDao } from '~/daos';
import { authEnsurer } from '~/services/auth';
import logger from '~/shared/logger';

type CreationBody = {
  scheduleName: string;
  memo: string;
  candidates: string;
};

const router = Router();
const { UNAUTHORIZED, INTERNAL_SERVER_ERROR } = httpStatusCodes;

router.get('/new', authEnsurer, (req, res) => {
  res.render('new', {
    user: req.user,
  });
});

router.post('/', authEnsurer, (req: Request<{}, {}, CreationBody>, res) => {
  // @ts-expect-error
  const createdBy = req.user?.id as number;
  if (!createdBy) {
    res.status(UNAUTHORIZED).send(createErrors());
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
      res.status(INTERNAL_SERVER_ERROR).send(createErrors());
    });
});

export default router;
