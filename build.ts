/**
 * Remove old files, copy front-end ones.
 */

import path from 'path';
import fs from 'fs-extra';
import { path as ROOT_PATH } from 'app-root-path';
import log4js from 'log4js';
import childProcess from 'child_process';

// Setup logger
const logger = log4js.getLogger();
logger.level = 'debug';

const relativePath = (p: string) => {
  return path.join(ROOT_PATH, p);
};

const remove = (loc: string): Promise<void> => {
  return new Promise((res, rej) => {
    return fs.remove(loc, (err) => {
      return err != null ? rej(err) : res();
    });
  });
};

const copy = (src: string, dest: string): Promise<void> => {
  return new Promise((res, rej) => {
    if (!fs.existsSync(src)) {
      logger.warn(`source file doesn't exist at '${src}'.`);
      return res();
    }
    return fs.copy(src, dest, (err) => {
      return err != null ? rej(err) : res();
    });
  });
};

const exec = (cmd: string, loc: string): Promise<void> => {
  return new Promise((res, rej) => {
    return childProcess.exec(cmd, { cwd: loc }, (err, stdout, stderr) => {
      if (!!stdout) {
        logger.info(stdout);
      }
      if (!!stderr) {
        logger.warn(stderr);
      }
      return !!err ? rej(err) : res();
    });
  });
};

(async () => {
  try {
    // Remove current build
    await remove(relativePath('dist/'));
    // Copy front-end files
    await copy(relativePath('src/public'), relativePath('dist/public'));
    await copy(relativePath('src/views'), relativePath('dist/views'));
    // Copy production env file
    await copy(relativePath('src/pre-start/env/.env.production'), relativePath('dist/pre-start/env/.env.production'));
    // Copy back-end files
    await exec('tsc --build tsconfig.build.json', './');
  } catch (err) {
    logger.error(err);
  }
})();
