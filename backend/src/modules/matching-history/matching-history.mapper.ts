import { RecruiterMatchingHistory } from '@prisma/client';

export function toMatchingHistorySummary(history: RecruiterMatchingHistory) {
  return {
    id: history.id.toString(),
    actionType: history.action_type,
    searchedAt: history.searched_at,
    job: {
      id: history.job_id?.toString() ?? null,
      title: history.job_title_snapshot,
      companyName: history.company_name_snapshot,
    },
  };
}

export function toMatchingHistoryDetail(history: RecruiterMatchingHistory) {
  return {
    ...toMatchingHistorySummary(history),
    response: history.response_snapshot,
  };
}
