import { Router } from 'express';
import createErrors from 'http-errors';
import httpStatusCodes from 'http-status-codes';

import { AvailabilityDao } from '~/daos';
import { authEnsurer } from '~/services/auth';
import type { AvailabilityAttributes } from '~/entities';
import logger from '~/shared/logger';

type Availability = AvailabilityAttributes['availability'];

type RequestParams = {
  scheduleId: string;
  userId: string;
  candidateId: string;
};

type RequestBody = {
  availability?: `${Availability}`;
};

type ResponseBody = {
  status: string;
  availability: Availability;
};

const router = Router();
const { INTERNAL_SERVER_ERROR } = httpStatusCodes;

router.post<RequestParams, ResponseBody, RequestBody>(
  '/:scheduleId/users/:userId/candidates/:candidateId',
  authEnsurer,
  (req, res, next) => {
    const { scheduleId, userId, candidateId } = req.params;
    const availability = parseInt(req.body.availability ?? '0', 10) as Availability;

    AvailabilityDao.upsert({
      scheduleId,
      userId: parseInt(userId, 10),
      candidateId: parseInt(candidateId, 10),
      availability,
    })
      .then(() => {
        res.json({
          status: 'OK',
          availability,
        });
      })
      .catch((err) => {
        logger.error(err);
        next(createErrors(INTERNAL_SERVER_ERROR));
      });
  },
);

export default router;
