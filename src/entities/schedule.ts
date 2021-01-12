import { ModelDefined, DataTypes } from 'sequelize';
import { db } from '~/infrastructure/db';

export interface ScheduleAttributes {
  scheduleId: number;
  scheduleName: string;
  memo: string;
  createdBy: number;
  updatedBy: Date;
}

export interface ScheduleCreationAttributes extends Omit<ScheduleAttributes, 'scheduleId'> {}

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
    updatedBy: {
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
