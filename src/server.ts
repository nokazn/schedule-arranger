import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import createError from 'http-errors';

import express, { NextFunction, Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import 'express-async-errors';
import session from 'express-session';

import logger from '~/shared/logger';
import { syncDb } from '~/entities';
import Router from '~/routes';
import { passport } from '~/services/auth';
import { IRequestError, SESSION_SECRET } from '~/shared/constants';

syncDb().catch((err) => {
  logger.error(err);
  throw err;
});

const app = express();
const { INTERNAL_SERVER_ERROR, NOT_FOUND } = StatusCodes;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'short' : 'dev'));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/', Router);

app.use((req, res, next) => {
  next(createError(NOT_FOUND));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: IRequestError, req: Request, res: Response, next: NextFunction) => {
  logger.error(error);
  res.locals.message = error.message;
  res.locals.error = req.app.get('env') === 'development' ? error : {};
  res.status(error.status ?? INTERNAL_SERVER_ERROR).render('error', {
    error,
  });
});

export default app;
