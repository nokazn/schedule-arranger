import { Router, Request } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';

import { ScheduleDao } from '~/daos';
import { authEnsurer } from '~/services/auth';
import csrfProtection from '~/services/csrf';
import { sliceScheduleName, createCandidatesAndRedirect, parseCandidateNames } from './index';
import type { CreationBody } from './index';
import logger from '~/shared/logger';

type RenderOptions = {
  user: Express.User | undefined;
  csrfToken: string;
};

const router = Router();
const { UNAUTHORIZED, INTERNAL_SERVER_ERROR } = httpStatusCodes;

router.get('/new', authEnsurer, csrfProtection, (req, res) => {
  res.render<RenderOptions>('new', {
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

export default router;
