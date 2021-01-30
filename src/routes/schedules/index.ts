import { Router, Request, Response } from 'express';

import { CandidateDao } from '~/daos';
import DetailRouter from './detail';
import EditRouter from './edit';
import NewRouter from './new';
import type { ScheduleAttributes, CandidateAttributes } from '~/entities';

export type ScheduleIdParam = {
  scheduleId: string;
};
export type CreationBody = {
  scheduleName: string;
  memo: string;
  candidates: string;
};

export const sliceScheduleName = (scheduleName: string | undefined | null) =>
  scheduleName?.slice(0, 255) || '(名称未設定)';

export const parseCandidateNames = (req: Request<{}, {}, Partial<CreationBody>>): string[] | undefined => {
  return req.body.candidates
    ?.trim()
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s !== '');
};

export const createCandidatesAndRedirect = (
  candidateNames: string[],
  scheduleId: string,
  res: Response,
): Promise<CandidateAttributes[]> => {
  const candidates = candidateNames.map((c) => ({
    candidateName: c,
    scheduleId,
  }));
  return CandidateDao.bulkAdd(candidates).then((c) => {
    res.redirect(`/schedules/${scheduleId}`);
    return c;
  });
};

export const isMine = (schedule: ScheduleAttributes, req: Request<any, any, any, any>) => {
  return req.user != null && schedule.createdBy === parseInt(req.user.id, 10);
};

const router = Router();

router.use('/', NewRouter, DetailRouter, EditRouter);

export default router;
