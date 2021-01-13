import { ModelDefined, DataTypes } from 'sequelize';
import { db } from '~/infrastructure/db';

export interface CandidateAttributes {
  candidateId: number;
  candidateName: string;
  scheduleId: string;
}

export interface CandidateCreationAttributes extends Omit<CandidateAttributes, 'candidateId'> {}

const Candidate: ModelDefined<CandidateAttributes, CandidateCreationAttributes> = db.define(
  'candidate',
  {
    candidateId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: true,
    },
    candidateName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['scheduleId'],
      },
    ],
  },
);

export default Candidate;
