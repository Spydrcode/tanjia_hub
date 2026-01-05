# Testing

## E2E (Playwright)

### Prerequisites
- Start the app locally: `pnpm dev` (or `npm run dev`).
- Set environment variables:
  - `DEMO_RESET_SECRET`
  - `E2E_TEST_USER_EMAIL`
  - `E2E_TEST_USER_PASSWORD`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Run
- `pnpm test:e2e`
- `pnpm test:e2e:ui`
- `pnpm test:e2e:headed`

### Notes
- Tests reset demo data via `/api/demo/reset` using `DEMO_RESET_SECRET`.
- Base URL defaults to `http://localhost:3000`, override with `E2E_BASE_URL`.
