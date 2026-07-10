# Activity Log

## 2026-06-29 — Report Feature

Added a simple report system so listers or borrowers can flag issues on approved or completed rentals. Admin reviews all reports in the admin panel.

**What changed:**
- `backend/migrations/020_create_reports.sql` — new `reports` table (request_id, reporter_id, reported_id, reason, description, status)
- `backend/src/types/report.ts` — `Report`, `NewReportInput`, `ReportReason`, `ReportStatus` types
- `backend/src/models/report.model.ts` — `ReportModel` with create, findByRequest, findAll, setStatus, existsByReporterAndRequest
- `backend/src/controllers/report.controller.ts` — guards (approved/completed only, no self-report, one report per request per user), notification to reported user
- `backend/src/routes/reports.ts` — `POST /api/reports`, `GET /api/reports/request/:requestId`, admin list + status endpoints
- `backend/src/types/notification.ts` — added `report_filed` notification type
- `backend/src/index.ts` — mounted `/api/reports`
- `frontend/src/types/report.ts` — mirrored types + label constants
- `frontend/src/types/notification.ts` — added missing types (`account_disabled`, `account_enabled`, `item_disabled`, `report_filed`)
- `frontend/src/api/reports.ts` — `createReport`, `getAdminReports`, `setAdminReportStatus`
- `frontend/src/hooks/useReports.ts` — `useCreateReport`, `useAdminReports`, `useAdminSetReportStatus`
- `frontend/src/pages/DashboardPage.tsx` — Report button on Active and Completed tabs (lister reports borrower); exported `ReportDialog`
- `frontend/src/pages/MyItemsPage.tsx` — Report button on Active and Completed sub-tabs (borrower reports lister)
- `frontend/src/pages/AdminPage.tsx` — new Reports tab with status filter, reason/description display, Resolve/Dismiss actions

**Why:** Damage claims were too complex for MVP. Simplified to a flat report flow: any party files a report on an approved or completed rental, admin handles it manually. No monetary resolution, no dispute flow.

**Pending:** Run `npm run migrate` (or apply `020_create_reports.sql` via psql) to create the `reports` table in the live DB before testing.
