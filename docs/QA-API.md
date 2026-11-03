# QA API connection

Deploy backend (see the BE repository `deploy/qa/README.md`), then configure this server-side environment variable in Vercel (Preview/Production as appropriate) or local `.env.local`:

```dotenv
QA_BACKEND_ORIGIN=https://<PUBLIC_IP_WITH_DASHES>.sslip.io
```

Do not add `NEXT_PUBLIC_` to this secret-less backend address; the Next.js server uses it. In local development use `http://localhost:8080`.

The Next.js route handler `src/app/api/[...path]/route.ts` proxies `/api/**` to Spring Boot, adds JWT Authorization from HttpOnly cookies, rotates refresh tokens on protected API 401, and handles login/logout without returning credentials to client-side JavaScript. Cross-site state-changing requests are rejected. The login UI now calls `/api/auth/login` and redirects to `/experiences` after success.

Minimal checks:
- Open `https://<backend-host>/v3/api-docs` to verify backend HTTPS.
- `POST /api/auth/login` on the frontend with existing QA credentials; verify `200` and HttpOnly cookie.
- `GET /api/experiences` after login; expect `{ "success": true, "data": [...] }`.
- `POST /api/auth/logout` to clear cookies and revoke refresh token.

**Not integrated yet:** experience dashboard and application board still use mock arrays; signup requires SMTP, Google OAuth requires client credentials and redirect settings. The QA API proxy does not by itself complete these features.

File uploads proxied through Vercel may hit its serverless request-body limit before the backend's 10 MB PDF limit; test large imports separately with an appropriate deployment strategy. For real personal data use stricter access controls. Avoid putting OpenAI/API keys in client-side code.
