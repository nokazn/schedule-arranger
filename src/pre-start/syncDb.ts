import { User, Schedule, Availability, Candidate, Comment } from '~/entities';
import logger from '~/shared/logger';

(async () => {
  await User.sync()
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
    });
})().catch((err) => {
  logger.error(err);
});
