import type { Model } from 'sequelize';
import { Availability, Candidate, Schedule } from '~/entities';
import type { AvailabilityAttributes, AvailabilityCreationAttributes } from '~/entities';

/**
 * it の中で Promise を返せるようにする必要がある
 */
export const deleteScheduleAggregate = async (scheduleId: string, done?: jest.DoneCallback): Promise<void> => {
  const availabilities = await Availability.findAll({ where: { scheduleId } }).catch((e: Error) => {
    console.error(e);
    return [] as Model<AvailabilityAttributes, AvailabilityCreationAttributes>[];
  });

  return Promise.all(availabilities.map((a) => a.destroy()))
    .then(() => Candidate.findAll({ where: { scheduleId } }))
    .then((candidates) => Promise.all(candidates.map((c) => c.destroy())))
    .then(() => Schedule.findByPk(scheduleId))
    .then((s) => s?.destroy())
    .catch((e: Error) => {
      console.error(e);
    })
    .finally(() => {
      if (done != null) done();
    });
};
