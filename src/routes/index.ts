import { Router } from 'express';
import TopRouter from './top';
import LoginRouter from './login';
import LogoutRouter from './logout';
import AuthGithubRouter from './auth/github';

const router = Router();

router.use('/', TopRouter);
router.use('/login', LoginRouter);
router.use('/logout', LogoutRouter);
router.use('/auth/github', AuthGithubRouter);

export default router;
