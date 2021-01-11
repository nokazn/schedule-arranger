import { Request } from 'express';
import { IUser } from '~/entities/User';

const ENV = process.env as Record<string, string>;

export const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET } = ENV;
export const PORT = parseInt(ENV.PORT, 10) || 3000;
export const BASE_URL = ENV.BASE_URL || 'http://localhost';
export const paramMissingError = 'One or more of the required parameters was missing.';

export interface IRequest extends Request {
  body: {
    user: IUser;
  };
}

export interface IRequestError extends Error {
  status?: number;
}
