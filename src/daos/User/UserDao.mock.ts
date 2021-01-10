import { IUser } from '~/entities/User';
import { getRandomInt } from '~/shared/functions';
import { IUserDao } from './UserDao';
// eslint-disable-next-line import/extensions
import MockDaoMock from '../MockDb/MockDao.mock';

class UserDao extends MockDaoMock implements IUserDao {
  public async getOne(email: string): Promise<IUser | null> {
    const db = await super.openDb();
    const user = db.users.find((u) => u.email === email);
    return user ?? null;
  }

  public async getAll(): Promise<IUser[]> {
    const db = await super.openDb();
    return db.users;
  }

  public async add(user: IUser): Promise<void> {
    const db = await super.openDb();
    db.users.push({
      ...user,
      id: getRandomInt(),
    });
    await super.saveDb(db);
  }

  public async update(user: IUser): Promise<void> {
    const db = await super.openDb();
    for (let i = 0; i < db.users.length; i += 1) {
      if (db.users[i].id === user.id) {
        db.users[i] = user;
        // eslint-disable-next-line no-await-in-loop
        await super.saveDb(db);
        return;
      }
    }
    throw new Error('User not found');
  }

  public async delete(id: number): Promise<void> {
    const db = await super.openDb();
    for (let i = 0; i < db.users.length; i += 1) {
      if (db.users[i].id === id) {
        db.users.splice(i, 1);
        // eslint-disable-next-line no-await-in-loop
        await super.saveDb(db);
        return;
      }
    }
    throw new Error('User not found');
  }
}

export default UserDao;
