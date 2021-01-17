import { Router } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';

import { ScheduleDao } from '~/daos';
import logger from '~/shared/logger';

const router = Router();
const { INTERNAL_SERVER_ERROR } = httpStatusCodes;

router.get('/', (req, res, next) => {
  logger.info(req.user);
  if (req.user == null) {
    res.render('top', {
      title: '予定調整くん',
      user: req.user,
    });
    return;
  }

  ScheduleDao.getAll({
    where: {
      createdBy: parseInt(req.user.id, 10),
    },
    order: [['"updatedAt', 'DESC']],
  })
    .then((schedules) => {
      res.render('top', {
        title: '予定調整くん',
        user: req.user,
        schedules,
      });
    })
    .catch((err: Error) => {
      logger.error(err);
      next(createErrors(INTERNAL_SERVER_ERROR));
    });
});

export default router;
