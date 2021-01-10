/**
 * Setup the jet-logger.
 *
 * Documentation: https://github.com/seanpmaxwell/jet-logger
 */

import log4js from 'log4js';

log4js.configure({
  appenders: {
    stdout: {
      type: 'stdout',
    },
    prod: {
      type: 'file',
      filename: 'server.log',
      backups: 1,
    },
  },
  categories: {
    default: {
      appenders: ['stdout'],
      level: 'all',
    },
    prod: {
      appenders: ['stdout', 'prod'],
      level: 'debug',
    },
  },
});
const logger = log4js.getLogger(process.env.NODE_ENV === 'production' ? 'prod' : 'default');

export default logger;
