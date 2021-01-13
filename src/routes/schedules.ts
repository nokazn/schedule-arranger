import { Router, Request } from 'express';
import { v4 as uuid } from 'uuid';
import httpStatusCodes from 'http-status-codes';

import { Schedule, Candidate } from '~/entities';
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
  const scheduleId = uuid();
  const updatedAt = new Date();
  // @ts-expect-error
  const createdBy = req.user?.id as number;
  if (!createdBy) {
    res.status(UNAUTHORIZED).redirect('/schedules/new');
    return;
  }
  Schedule.create({
    scheduleId,
    scheduleName: req.body.scheduleName.slice(0, 255) || '(名称未設定)',
    memo: req.body.memo,
    createdBy,
    updatedAt,
  })
    .then((schedule) => {
      const candidates = req.body.candidates
        .trim()
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s !== '')
        .map((c) => ({
          candidateName: c,
          scheduleId: schedule.getDataValue('scheduleId'),
        }));
      return Promise.all([Candidate.bulkCreate(candidates), schedule] as const);
    })
    .then(([, schedule]) => {
      res.redirect(`/schedules/${schedule.getDataValue('scheduleId')}`);
    })
    .catch((err: Error) => {
      logger.error(err);
      res.status(INTERNAL_SERVER_ERROR).send();
    });
});

export default router;
