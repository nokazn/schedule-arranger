/* eslint-disable class-methods-use-this */
import type { FindOptions } from 'sequelize';
import { v4 as uuid } from 'uuid';

import { Schedule, ScheduleAttributes, ScheduleCreationAttributes } from '~/entities';
import logger from '~/shared/logger';

export interface IScheduleDao {
  getOne(options: FindOptions<ScheduleAttributes>): Promise<ScheduleAttributes | undefined>;
  getAll(options: FindOptions<ScheduleAttributes>): Promise<ScheduleAttributes[]>;
  add(params: ScheduleCreationAttributes): Promise<ScheduleAttributes>;
  update(params: ScheduleCreationAttributes): Promise<number>;
}

class ScheduleDao implements IScheduleDao {
  public getOne(options?: FindOptions<ScheduleAttributes>): Promise<ScheduleAttributes | undefined> {
    return Schedule.findOne(options)
      .then((schedule) => schedule?.get())
      .catch((err: Error) => {
        logger.error(err);
        return undefined;
      });
  }

  public getAll(options?: FindOptions<ScheduleAttributes>): Promise<ScheduleAttributes[]> {
    return Schedule.findAll(options)
      .then((schedules) => schedules.map((s) => s.get()))
      .catch((err: Error) => {
        logger.error(err);
        return [];
      });
  }

  public add(params: Omit<ScheduleCreationAttributes, 'scheduleId' | 'updatedAt'>): Promise<ScheduleAttributes> {
    const scheduleId = uuid();
    const updatedAt = new Date();
    return Schedule.create({
      scheduleId,
      updatedAt,
      ...params,
    })
      .then((schedule) => schedule.get())
      .catch((err: Error) => {
        logger.error(err);
        throw err;
      });
  }

  public update(params: Omit<ScheduleCreationAttributes, 'updatedAt'>): Promise<number> {
    const updatedAt = new Date();
    return Schedule.update(
      {
        updatedAt,
        ...params,
      },
      {
        where: { scheduleId: params.scheduleId },
      },
    )
      .then(([rows]) => rows)
      .catch((err: Error) => {
        logger.error(err);
        throw err;
      });
  }
}

export default new ScheduleDao();
