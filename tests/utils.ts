import { Availability, Candidate, Schedule, Comment } from '~/entities';

/**
 * it の中で Promise を返せるようにする必要がある
 */
export const deleteScheduleAggregate = async (scheduleId: string, done?: jest.DoneCallback): Promise<void> => {
  const deleteComments = Comment.findAll({ where: { scheduleId } })
    .then((comments) => Promise.all(comments.map((c) => c.destroy())))
    .catch((e: Error) => {
      console.error(e);
    });

  const deleteAttributes = Availability.findAll({ where: { scheduleId } })
    .then((availabilities) => Promise.all(availabilities.map((a) => a.destroy())))
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

  return Promise.all([deleteComments, deleteAttributes] as const)
    .then(() => {})
    .catch((err) => {
      console.error(err);
    });
};
