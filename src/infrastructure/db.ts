import { Sequelize } from 'sequelize';
import { DB_URI } from '~/shared/constants';

const db = new Sequelize(DB_URI, {
  logging: false,
  dialect: 'postgres',
  define: {
    freezeTableName: true,
  },
});

export { Sequelize, db };
