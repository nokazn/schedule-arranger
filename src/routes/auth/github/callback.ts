import { Router } from 'express';
import { githubAuthenticator } from '~/services/auth';

const router = Router();

router.get(
  '/',
  githubAuthenticator({
    failureRedirect: '/login',
  }),
  (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const loginFrom = req.cookies.loginFrom as string | undefined;
    if (typeof loginFrom === 'string' && !loginFrom.includes('http://') && !loginFrom.includes('https://')) {
      res.redirect(loginFrom);
    }
    res.redirect('/');
  },
);

export default router;
