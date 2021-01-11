import { Router } from 'express';
import TopRouter from './top';
import UserRouter from './Users';

const router = Router();

router.use('/', TopRouter);
router.use('/users', UserRouter);

export default router;
