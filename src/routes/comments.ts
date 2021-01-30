import { Router, Request } from 'express';
import createErrors from 'http-errors';

import CommentDao from '~/daos/comment';
import { authEnsurer } from '~/services/auth';
import csrfProtection from '~/services/csrf';
import logger from '~/shared/logger';

const router = Router();

type CommentParam = {
  scheduleId: string;
  userId: string;
};

type CommentBody = {
  comment: string;
};

router.post(
  '/:scheduleId/users/:userId/comments',
  authEnsurer,
  csrfProtection,
  (req: Request<CommentParam, {}, CommentBody>, res, next) => {
    const { scheduleId, userId } = req.params;
    const { comment } = req.body;

    CommentDao.upsert({
      scheduleId,
      userId: parseInt(userId, 10),
      comment: comment.slice(0, 255),
    })
      .then(() => {
        res.json({ status: 'OK', comment });
      })
      .catch((err: Error) => {
        logger.error(err);
        next(createErrors(err));
      });
  },
);

export default router;
