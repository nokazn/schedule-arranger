import { Router } from 'express';
import httpStatusCodes from 'http-status-codes';
import createErrors from 'http-errors';

import { ScheduleDao } from '~/daos';
import dayjs from '~/shared/dayjs';
import logger from '~/shared/logger';
import type { ScheduleAttributes } from '~/entities';

const router = Router();
const { INTERNAL_SERVER_ERROR } = httpStatusCodes;

type RenderOptions = {
  title: string;
  user: Express.User | undefined;
  schedules: (ScheduleAttributes & { formattedUpdatedAt: string })[];
};

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
      res.render<RenderOptions>('top', {
        title: '予定調整くん',
        user: req.user,
        schedules: schedules.map((s) => ({
          ...s,
          formattedUpdatedAt: dayjs(s.updatedAt).format('YYYY/MM/DD HH:mm'),
        })),
      });
    })
    .catch((err: Error) => {
      logger.error(err);
      next(createErrors(INTERNAL_SERVER_ERROR));
    });
});

export default router;
