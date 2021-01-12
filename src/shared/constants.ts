const ENV = process.env as Record<string, string>;

export const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET } = ENV;
export const PORT = parseInt(ENV.PORT, 10) || 3000;
export const BASE_URL = ENV.BASE_URL || 'http://localhost';

const { DATABASE_URL } = process.env;
const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = ENV;
export const DB_URI = DATABASE_URL ?? `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

export const paramMissingError = 'One or more of the required parameters was missing.';

export interface IRequestError extends Error {
  status?: number;
}
