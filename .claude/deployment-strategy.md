# Hiram Deployment Strategy

## Backend — AWS Elastic Beanstalk
- **Platform**: Node.js on Elastic Beanstalk (`ap-southeast-2`)
- **Environment**: `hiram-backend-prod-env`
- **URL**: `hiram-backend-prod-env.eba-j63hagpx.ap-southeast-2.elasticbeanstalk.com`
- **Runtime**: Compiled TypeScript → `dist/`, served via `node dist/index.js` (Procfile)
- **CI/CD**: GitHub Actions (`deploy-backend.yml`) — builds TS, zips `dist/` + `package.json` + `Procfile`, deploys to EB on every push to `master` that touches `backend/`

## Database — AWS RDS PostgreSQL
- **Host**: `skill-tracker-db.cpk6oiaeul66.ap-southeast-2.rds.amazonaws.com`
- **Region**: `ap-southeast-2`
- **Connection**: Via `DATABASE_URL` env var set in EB environment, SSL enabled (`rejectUnauthorized: false`)
- **Pool config**: `connectionTimeoutMillis: 5000` so health check fails fast if DB is unreachable
- **Security**: RDS security group (`sg-07f185bac4d40ed32`) has inbound rule allowing port `5432` from EB security group (`sg-0ea8eca5c434a3950` — Hiram-backend-prod) only — not public
- **Migrations**: SQL files in `backend/migrations/`, applied manually via `npm run migrate`

## Frontend — S3 + CloudFront
- **Storage**: S3 bucket `hiram-frontend-prod` (`ap-southeast-2`) with static website hosting
- **CDN**: CloudFront distribution `E3MGR3P4JXAZ7G`
- **URL**: `https://d24lgm15jlt3j.cloudfront.net`
- **CI/CD**: GitHub Actions (`deploy-frontend.yml`) — runs `vite build`, syncs `dist/` to S3, invalidates CloudFront cache on every push to `master` that touches `frontend/`

## API Routing (Mixed Content Fix)
- Frontend calls `/api/*` (relative, no domain)
- CloudFront routes `/api/*` → EB backend (HTTP, `CachingDisabled`, `AllViewer` origin policy)
- CloudFront routes `/*` → S3 frontend (HTTPS to browser)
- Result: everything served over HTTPS from one domain — no mixed content

## IAM User (`hiram-s3-uploader`)
| Policy | Purpose |
|---|---|
| `AmazonS3FullAccess` | Upload frontend build to S3 |
| `AdministratorAccess-AWSElasticBeanstalk` | Deploy backend to EB |
| `CloudFrontInvalidation` (inline) | Invalidate CDN cache after deploy |

## GitHub Secrets
| Secret | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM credentials |
| `S3_BUCKET_NAME` | `hiram-frontend-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E3MGR3P4JXAZ7G` |