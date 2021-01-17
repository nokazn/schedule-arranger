import { Router } from 'express';
import { githubAuthenticator } from '~/services/auth';

const router = Router();

router.get(
  '/',
  githubAuthenticator({
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.redirect('/');
  },
);

export default router;
