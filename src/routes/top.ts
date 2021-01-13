import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Top',
    user: req.user,
  });
});

export default router;
