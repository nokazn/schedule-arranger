import { FindOptions } from 'sequelize';
import { Availability, AvailabilityAttributes } from '~/entities';
import logger from '~/shared/logger';

export interface IAvailabilityDao {
  getAll(options: FindOptions<AvailabilityAttributes>): Promise<AvailabilityAttributes[]>;
}

class AvailabilityDao implements IAvailabilityDao {
  public getAll(options: FindOptions<AvailabilityAttributes>): Promise<AvailabilityAttributes[]> {
    return Availability.findAll(options)
      .then((availability) => availability.map((a) => a.get()))
      .catch((err: Error) => {
        logger.error(err);
        return [];
      });
  }
}

export default new AvailabilityDao();
