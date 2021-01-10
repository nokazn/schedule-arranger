import StatusCodes from 'http-status-codes';
import { Request, Response, Router } from 'express';

// eslint-disable-next-line import/extensions
import UserDao from '~/daos/User/UserDao.mock';
import { paramMissingError, IRequest } from '~/shared/constants';
import logger from '~/shared/logger';

const router = Router();
const userDao = new UserDao();
const { BAD_REQUEST, CREATED, OK } = StatusCodes;

/** ****************************************************************************
 *                      Get All Users - "GET /api/users/all"
 ***************************************************************************** */

router.get('/all', (req: Request, res: Response) => {
  userDao
    .getAll()
    .then((users) => {
      res.status(OK).json({ users });
    })
    .catch((err) => {
      logger.error(err);
    });
});

/** ****************************************************************************
 *                       Add One - "POST /api/users/add"
 ***************************************************************************** */

router.post('/add', (req: IRequest, res: Response) => {
  const { user } = req.body;
  if (!user) {
    res.status(BAD_REQUEST).json({
      error: paramMissingError,
    });
    return;
  }
  userDao
    .add(user)
    .then(() => {
      res.status(CREATED).end();
    })
    .catch((err) => {
      logger.error(err);
    });
});

/** ****************************************************************************
 *                       Update - "PUT /api/users/update"
 ***************************************************************************** */

router.put('/update', (req: IRequest, res: Response) => {
  const { user } = req.body;
  if (!user) {
    res.status(BAD_REQUEST).json({
      error: paramMissingError,
    });
    return;
  }
  user.id = Number(user.id);
  userDao
    .update(user)
    .then(() => {
      res.status(OK).end();
    })
    .catch((err) => {
      logger.error(err);
    });
});

/** ****************************************************************************
 *                    Delete - "DELETE /api/users/delete/:id"
 ***************************************************************************** */

router.delete('/delete/:id', (req: IRequest, res: Response) => {
  const { id } = req.params;
  userDao
    .delete(Number(id))
    .then(() => {
      res.status(OK).end();
    })
    .catch((err) => {
      logger.error(err);
    });
});

/** ****************************************************************************
 *                                     Export
 ***************************************************************************** */

export default router;
