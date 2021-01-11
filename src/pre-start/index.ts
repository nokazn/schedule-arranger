/**
 * Pre-start is where we want to place things that must run BEFORE the express server is started.
 * This is useful for environment variables, command-line arguments, and cron-jobs.
 */

import path from 'path';
import dotenv from 'dotenv';
import commandLineArgs from 'command-line-args';

(() => {
  // Setup command line options
  const options = commandLineArgs([
    {
      name: 'env',
      alias: 'e',
      defaultValue: 'development',
      type: String,
    },
  ]);
  const envType = (options.env as string | undefined) ?? 'development';
  const result = dotenv.config({
    path: path.join(__dirname, `env/.env.${envType}`),
  });
  if (result.error) {
    throw result.error;
  }

  const envs = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'SESSION_SECRET'];
  envs.forEach((env) => {
    if (process.env[env] == null) {
      throw new Error('Environmental variables are not set correctly.');
    }
  });
})();
