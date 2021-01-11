import { Router } from 'express';
import { githubAuthenticator } from '~/services/auth';
import AuthGithubCallbackRouter from './callback';

const router = Router();

router.get('/', githubAuthenticator({ scope: ['user:email'] }), () => {});
router.use('/callback', AuthGithubCallbackRouter);

export default router;
