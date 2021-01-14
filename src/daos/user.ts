import User from '~/entities/user';
import type { UserAttributes } from '~/entities/user';
import logger from '~/shared/logger';

export interface IUserDao {
  upsert: (user: UserAttributes) => Promise<UserAttributes>;
}

class UserDao implements IUserDao {
  public upsert(user: UserAttributes): Promise<UserAttributes> {
    // https://sequelize.org/master/class/lib/model.js~Model.html
    return User.upsert(user)
      .then(([u]) => u.get())
      .catch((err) => {
        logger.error(err);
        throw err;
      });
  }
}

export default new UserDao();
