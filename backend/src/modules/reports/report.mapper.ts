/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { ReportTargetType } from '@prisma/client';

type ReportWithRelations = any;

const toId = (value?: bigint | number | string | null) =>
  value === undefined || value === null ? null : value.toString();

const getTargetId = (report: ReportWithRelations) => {
  if (report.target_type === ReportTargetType.job) {
    return toId(report.job_id);
  }

  return toId(report.company_id);
};

const getTargetTitle = (report: ReportWithRelations) => {
  if (report.target_type === ReportTargetType.job) {
    return report.job?.title ?? null;
  }

  return report.company?.name ?? null;
};

const mapReporterName = (report: ReportWithRelations) =>
  report.reporter?.user?.full_name ?? report.reporter?.email ?? null;

export const mapReportSummary = (report: ReportWithRelations) => ({
  id: toId(report.id),
  targetType: report.target_type,
  targetId: getTargetId(report),
  targetTitle: getTargetTitle(report),
  reporterAccountId: toId(report.reporter_account_id),
  reporterName: mapReporterName(report),
  reason: report.reason,
  status: report.status,
  createdAt: report.created_at,
  updatedAt: report.updated_at,
});

export const mapReportDetail = (report: ReportWithRelations) => ({
  ...mapReportSummary(report),
  latestAdminNote: report.latest_admin_note,
  reviewedByAccountId: toId(report.reviewed_by_account_id),
  reviewedAt: report.reviewed_at,
  target:
    report.target_type === ReportTargetType.job
      ? {
          id: toId(report.job?.id),
          title: report.job?.title,
          status: report.job?.status,
          companyId: toId(report.job?.company_id),
          companyName: report.job?.company?.name,
        }
      : {
          id: toId(report.company?.id),
          name: report.company?.name,
          status: report.company?.status,
          accountId: toId(report.company?.account_id),
        },
  history: (report.histories ?? []).map((history) => ({
    id: toId(history.id),
    fromStatus: history.from_status,
    toStatus: history.to_status,
    changedByAccountId: toId(history.changed_by_account_id),
    changedByName:
      history.changed_by?.user?.full_name ?? history.changed_by?.email ?? null,
    note: history.note,
    action: history.action,
    createdAt: history.created_at,
  })),
});
