# AWS RDS PostgreSQL Setup — Deployment DB

## Summary

Created a new standard RDS PostgreSQL instance (not Aurora — Aurora is not free-tier eligible) and migrated the local `hiram_db` database into it.

## Instance details

| Setting | Value |
|---|---|
| Engine | PostgreSQL |
| Instance class | `db.t4g.micro` (Free Tier) |
| DB identifier | `db-aws-rodrigo` |
| Region | ap-southeast-2 |
| Storage | 20 GB |
| Multi-AZ | No |
| Publicly accessible | Yes (restricted by security group) |
| Master username | `postgres` |
| Database | `hiram_db` |
| PostGIS | Enabled via `CREATE EXTENSION IF NOT EXISTS postgis;` |

## Steps performed

1. Checked AWS account billing/free tier status — confirmed a "Free Plan" (credits-based) account with no RDS usage yet; Aurora ruled out due to no free-tier coverage.
2. Created RDS instance via **Full configuration**, Free Tier template, `db.t4g.micro`, single-AZ.
3. Enabled **Publicly accessible** on the instance (Modify → Connectivity).
4. Created a dedicated security group `hiram-db-sg` (PostgreSQL/5432, source = My IP) and attached it to the instance, removing the shared `default` security group.
5. Registered the instance in pgAdmin4 using the RDS endpoint, port 5432, and master credentials.
6. Created the `hiram_db` database and enabled the `postgis` extension.
7. Backed up local `hiram_db` via pgAdmin4 (**Backup**, Custom format).
8. Restored into RDS `hiram_db` via pgAdmin4 (**Restore**, Custom format, "No owner" + "No privileges" enabled to avoid role mismatch errors).

## Notes / follow-ups

- Security group source is "My IP" — a static snapshot, not auto-updating. If it changes, re-edit the inbound rule and re-select "My IP".
- `DATABASE_URL` in `backend/.env` (local) or Elastic Beanstalk env vars (deployed) still needs to be updated to point at this instance's endpoint when ready to cut over.
- Old production RDS instance was left untouched — no cutover has happened yet, this is a parallel/staging setup.
