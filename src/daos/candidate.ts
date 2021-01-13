/* eslint-disable class-methods-use-this */
import type { FindOptions } from 'sequelize';

import { Candidate, CandidateAttributes, CandidateCreationAttributes } from '~/entities';
import logger from '~/shared/logger';

export interface ICandidateDao {
  getAll(options: FindOptions<CandidateAttributes>): Promise<CandidateAttributes[]>;
  add(candidate: Omit<CandidateCreationAttributes, 'candidateId' | 'updatedAt'>): Promise<CandidateAttributes>;
  bulkAdd(candidates: Omit<CandidateCreationAttributes, 'candidateId' | 'updatedAt'>[]): Promise<CandidateAttributes[]>;
}

class CandidateDao implements ICandidateDao {
  public getAll(options?: FindOptions<CandidateAttributes>): Promise<CandidateAttributes[]> {
    return Candidate.findAll(options)
      .then((Candidates) => Candidates.map((s) => s.get()))
      .catch((err: Error) => {
        logger.error(err);
        return [];
      });
  }

  public add(candidate: Omit<CandidateCreationAttributes, 'candidateId' | 'updatedAt'>): Promise<CandidateAttributes> {
    return Candidate.create(candidate)
      .then((c) => c.get())
      .catch((err: Error) => {
        throw err;
      });
  }

  public bulkAdd(
    candidates: Omit<CandidateCreationAttributes, 'candidateId' | 'updatedAt'>[],
  ): Promise<CandidateAttributes[]> {
    return Candidate.bulkCreate(candidates)
      .then((l) => l.map((c) => c.get()))
      .catch((err: Error) => {
        throw err;
      });
  }
}

export default new CandidateDao();
