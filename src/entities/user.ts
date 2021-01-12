import { ModelDefined, DataTypes } from 'sequelize';
import { db } from '~/infrastructure/db';

export interface UserAttributes {
  userId: number;
  username: string;
  displayName: string;
  profileUrl: string;
}

export interface UserCreationAttributes extends UserAttributes {}

const User: ModelDefined<UserAttributes, UserCreationAttributes> = db.define(
  'users',
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  },
);

export default User;
