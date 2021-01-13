import { Router } from 'express';
import TopRouter from './top';
import LoginRouter from './login';
import LogoutRouter from './logout';
import SchedulesRouter from './schedules';
import AuthGithubRouter from './auth/github';

const router = Router();

router.use('/', TopRouter);
router.use('/login', LoginRouter);
router.use('/logout', LogoutRouter);
router.use('/schedules', SchedulesRouter);
router.use('/auth/github', AuthGithubRouter);

export default router;
