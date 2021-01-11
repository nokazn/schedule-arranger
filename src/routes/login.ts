import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('login', {
    user: req.user,
  });
});

export default router;
