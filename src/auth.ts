import passport from 'passport';
import { Strategy as GithubStrategy } from 'passport-github2';
import type { VerifyCallback } from 'passport-oauth2';

import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BASE_URL, PORT } from '~/shared/constants';
import logger from './shared/logger';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj: {}, done) => {
  done(null, obj);
});

logger.debug(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);

passport.use(
  new GithubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: `${BASE_URL}:${PORT}`,
    },
    (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
      process.nextTick(() => {
        done(null, profile);
      });
    },
  ),
);

export { passport };
