import { Router } from 'express';
import { githubAuthenticator } from '~/services/auth';
import logger from '~/shared/logger';

const router = Router();

router.get(
  '/',
  githubAuthenticator({
    failureRedirect: '/login',
  }),
  (req, res) => {
    logger.debug('callbacked');
    res.redirect('/');
  },
);

export default router;
