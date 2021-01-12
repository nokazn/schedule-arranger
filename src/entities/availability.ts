import { ModelDefined, DataTypes } from 'sequelize';
import { db } from '~/infrastructure/db';

export interface AvailabilityAttributes {
  candidateId: number;
  userId: string;
  availability: number;
  scheduleId: string;
}

export interface AvailabilityCreationAttributes extends Omit<AvailabilityAttributes, 'candidateId'> {}

const Availability: ModelDefined<AvailabilityAttributes, AvailabilityCreationAttributes> = db.define(
  'availabilities',
  {
    candidateId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    availability: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    scheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['scheduleId'],
      },
    ],
  },
);

export default Availability;
