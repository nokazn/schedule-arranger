import logger from './logger';

export const pErr = (err: Error) => {
  if (err) {
    logger.error(err);
  }
};

export const getRandomInt = () => Math.floor(Math.random() * 1_000_000_000_000);
