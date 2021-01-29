import passport from 'passport';
import { Strategy as GithubStrategy, Profile } from 'passport-github2';
import type { AuthenticateOptions } from 'passport';
import type { VerifyCallback } from 'passport-oauth2';
import type { RequestHandler } from 'express';

import { UserDao } from '~/daos';
import logger from '~/shared/logger';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BASE_URL, PORT } from '~/shared/constants';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj: Express.User, done) => {
  done(null, obj);
});

passport.use(
  new GithubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: `${BASE_URL}:${PORT}/auth/github/callback`,
    },
    (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      process.nextTick(() => {
        if (profile.username == null) {
          const err = new Error('failed to get username');
          logger.error(err.message, profile);
          done(err, profile);
          return;
        }
        UserDao.upsert({
          userId: parseInt(profile.id, 10),
          username: profile.username,
          displayName: profile.displayName,
          profileUrl: profile.profileUrl,
        })
          .then(() => {
            done(null, profile);
          })
          .catch((err) => {
            logger.error(err);
          });
      });
    },
  ),
);

const githubAuthenticator = (options: AuthenticateOptions, cb?: (...args: any[]) => any) =>
  passport.authenticate('github', options, cb) as RequestHandler;

const authEnsurer: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  res.redirect(`/login?from=${req.originalUrl}`);
};

export { passport, githubAuthenticator, authEnsurer };
