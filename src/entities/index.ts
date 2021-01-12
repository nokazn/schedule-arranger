import User from './user';
import Schedule from './schedule';
import Availability from './availability';
import Candidate from './candidate';
import Comment from './comment';
import logger from '~/shared/logger';

export { User, Schedule, Availability, Candidate, Comment };

export const syncDb = () => {
  return User.sync()
    .then(() => {
      Schedule.belongsTo(User, {
        foreignKey: 'createdBy',
      });
      Comment.belongsTo(User, { foreignKey: 'userId' });
      Availability.belongsTo(User, {
        foreignKey: 'userId',
      });
      return Promise.all([Schedule.sync(), Candidate.sync(), Comment.sync()]);
    })
    .then(() => {
      Availability.belongsTo(Candidate, {
        foreignKey: 'candidateId',
      });
      return Availability.sync();
    })
    .catch((err: Error) => {
      logger.error(err);
    });
};
