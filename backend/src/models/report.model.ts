import { pool } from "../db";
import type { Report, NewReportInput, ReportStatus } from "../types/report";

function rowToReport(row: Record<string, unknown>): Report {
  return {
    id: row["id"] as string,
    requestId: row["request_id"] as string,
    reporterId: row["reporter_id"] as string,
    reporterName: row["reporter_name"] as string,
    reportedId: row["reported_id"] as string,
    reportedName: row["reported_name"] as string,
    itemTitle: row["item_title"] as string,
    reason: row["reason"] as Report["reason"],
    description: row["description"] as string,
    status: row["status"] as ReportStatus,
    resolutionNote: (row["resolution_note"] as string | null) ?? undefined,
    createdAt:
      row["created_at"] instanceof Date
        ? (row["created_at"] as Date).toISOString()
        : (row["created_at"] as string),
  };
}

const BASE_SELECT = `
  SELECT
    r.id, r.request_id, r.reporter_id, r.reported_id,
    r.reason, r.description, r.status, r.created_at,
    reporter.name AS reporter_name,
    reported.name  AS reported_name,
    i.title        AS item_title
  FROM public.reports r
  JOIN public.users    reporter ON reporter.id = r.reporter_id
  JOIN public.users    reported  ON reported.id  = r.reported_id
  JOIN public.requests req       ON req.id       = r.request_id
  JOIN public.items    i         ON i.id         = req.item_id
`;

export const ReportModel = {
  async create(input: NewReportInput, reporterId: string): Promise<Report> {
    const result = await pool.query(
      `INSERT INTO public.reports (request_id, reporter_id, reported_id, reason, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.requestId, reporterId, input.reportedId, input.reason, input.description]
    );
    const id = (result.rows[0] as Record<string, unknown>)["id"] as string;
    const full = await pool.query(`${BASE_SELECT} WHERE r.id = $1`, [id]);
    return rowToReport(full.rows[0] as Record<string, unknown>);
  },

  async findByReporter(reporterId: string): Promise<Report[]> {
    const result = await pool.query(`${BASE_SELECT} WHERE r.reporter_id = $1 ORDER BY r.created_at DESC`, [reporterId]);
    return result.rows.map((row) => rowToReport(row as Record<string, unknown>));
  },

  async findByRequest(requestId: string): Promise<Report[]> {
    const result = await pool.query(`${BASE_SELECT} WHERE r.request_id = $1 ORDER BY r.created_at DESC`, [requestId]);
    return result.rows.map((row) => rowToReport(row as Record<string, unknown>));
  },

  async findAll(status?: ReportStatus): Promise<Report[]> {
    const where = status ? `WHERE r.status = $1` : "";
    const params = status ? [status] : [];
    const result = await pool.query(`${BASE_SELECT} ${where} ORDER BY r.created_at DESC`, params);
    return result.rows.map((row) => rowToReport(row as Record<string, unknown>));
  },

  async setStatus(id: string, status: ReportStatus, note: string): Promise<Report | null> {
    await pool.query(
      `UPDATE public.reports SET status = $1, resolution_note = $2 WHERE id = $3`,
      [status, note, id]
    );
    const result = await pool.query(`${BASE_SELECT} WHERE r.id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return rowToReport(result.rows[0] as Record<string, unknown>);
  },

  async existsByReporterAndRequest(reporterId: string, requestId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM public.reports WHERE reporter_id = $1 AND request_id = $2 LIMIT 1`,
      [reporterId, requestId]
    );
    return result.rows.length > 0;
  },
};
