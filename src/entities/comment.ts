import { ModelDefined, DataTypes } from 'sequelize';
import { db } from '~/infrastructure/db';

export interface CommentAttributes {
  scheduleId: string;
  userId: number;
  comment: string;
}

export interface CommentCreationAttributes extends CommentAttributes {}

const Comment: ModelDefined<CommentAttributes, CommentCreationAttributes> = db.define(
  'comments',
  {
    scheduleId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  },
);

export default Comment;
