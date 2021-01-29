import { Router, Request } from 'express';

const router = Router();

type Query = {
  from?: string;
};

router.get('/', (req: Request<{}, {}, {}, Query>, res) => {
  const { from } = req.query;
  if (typeof from === 'string') {
    res.cookie('loginFrom', from, { expires: new Date(Date.now() + 10 * 60 * 1000) });
  }
  res.render('login', {
    user: req.user,
  });
});

export default router;
