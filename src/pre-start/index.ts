/**
 * Pre-start is where we want to place things that must run BEFORE the express server is started.
 * This is useful for environment variables, command-line arguments, and cron-jobs.
 */

import path from 'path';
import dotenv from 'dotenv';
import commandLineArgs from 'command-line-args';
import logger from '~/shared/logger';

// 候補の配列の内すべての要素が process.env に存在するものがあればチェックを通す
const checkEnv = (...candidates: string[][]) => {
  return candidates.reduce((prev, curr) => {
    return prev || curr.every((env) => process.env[env] != null);
  }, false);
};

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

  const isValid1 = checkEnv(['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'SESSION_SECRET']);
  const isValid2 = checkEnv(['DATABASE_URL', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'], ['DB_DATABASE']);
  if (!isValid1 || !isValid2) {
    logger.error(result, result.parsed);
    throw new Error('Environmental variables are not set correctly.');
  }
})();
