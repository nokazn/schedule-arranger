import { ModelDefined, DataTypes } from 'sequelize';
import { db } from '~/infrastructure/db';

export interface ScheduleAttributes {
  scheduleId: string;
  scheduleName: string;
  memo: string;
  createdBy: number;
  updatedAt: Date;
}

export interface ScheduleCreationAttributes extends ScheduleAttributes {}

const Schedule: ModelDefined<ScheduleAttributes, ScheduleCreationAttributes> = db.define(
  'schedule',
  {
    scheduleId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    scheduleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    memo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['createdBy'],
      },
    ],
  },
);

export default Schedule;
