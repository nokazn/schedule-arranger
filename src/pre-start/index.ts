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
  // Set the env file
  const result = dotenv.config({
    path: path.join(__dirname, `env/.env.${envType}`),
  });
  if (result.error) {
    throw result.error;
  }
})();
