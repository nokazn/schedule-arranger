import passport from 'passport';
import { Strategy as GithubStrategy } from 'passport-github2';
import type { AuthenticateOptions } from 'passport';
import type { VerifyCallback } from 'passport-oauth2';
import type { RequestHandler } from 'express';

import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BASE_URL, PORT } from '~/shared/constants';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj: {}, done) => {
  done(null, obj);
});

passport.use(
  new GithubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: `${BASE_URL}:${PORT}/auth/github/callback`,
    },
    (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
      process.nextTick(() => {
        done(null, profile);
      });
    },
  ),
);

const githubAuthenticator = (options: AuthenticateOptions, cb?: (...args: any[]) => any) =>
  passport.authenticate('github', options, cb) as RequestHandler;

export { passport, githubAuthenticator };
