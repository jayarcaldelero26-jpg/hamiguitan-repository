# Hamiguitan Repository

Next.js repository system for authenticated document access, Google Drive-backed file storage, and staff/admin account management.

## Getting Started

1. Install dependencies.
2. Create `.env.local` from `.env.example`.
3. Start the development server.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment Variables

Required in local and deployment environments:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL used by server and browser clients.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe Supabase key used by client-side storage access.
- `SUPABASE_SERVICE_ROLE_KEY`: privileged Supabase key used by server-side API routes.
- `JWT_SECRET`: signing key for the `auth_token` cookie.
- `GOOGLE_CLIENT_ID`: Google OAuth client ID used for Drive access.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret used for Drive access.
- `GOOGLE_REDIRECT_URI`: OAuth redirect URI used for Drive token setup.
- `GOOGLE_REFRESH_TOKEN`: refresh token used by server-side Google Drive operations.
- `DRIVE_ROOT_FOLDER_ID`: root Drive folder for repository organization.
- `DRIVE_ACADEME_FOLDER_ID`: Drive folder ID for Academe documents.
- `DRIVE_STAKEHOLDERS_FOLDER_ID`: Drive folder ID for Stakeholders documents.
- `DRIVE_PAMO_FOLDER_ID`: Drive folder ID for PAMO Activity documents.
- `TEMP_UPLOADS_BUCKET`: Supabase Storage bucket used for staged uploads before Drive transfer. Defaults to `temp-uploads` if omitted.
- `SMTP_HOST`: SMTP host used for password reset email delivery.
- `SMTP_PORT`: SMTP port used for password reset email delivery.
- `SMTP_SECURE`: `true` or `false` for SMTP TLS mode.
- `SMTP_USER`: SMTP username.
- `SMTP_PASS`: SMTP password.
- `SMTP_FROM`: sender address used for password reset emails.

## Deployment Notes

- The app now fails fast if required auth, Supabase, Drive, or SMTP environment variables are missing or malformed.
- Google Drive routes depend on a valid refresh token and the configured folder IDs.
- Password reset routes depend on SMTP connectivity.
- Upload, staged transfer, download, and preview routes are stream-based, but your host still needs enough request time and memory headroom for files up to the enforced limits.
- The repository does not provision external infrastructure. Supabase schema, storage buckets, SMTP credentials, and Google Drive access must exist before deployment.

## External Infrastructure

This repository expects the following external resources to already exist:

- Supabase table `users`
  - Columns referenced by the app: `id`, `name`, `email`, `password`, `role`, `avatar`, `userCode`, `firstName`, `middleName`, `lastName`, `suffix`, `birthdate`, `employmentType`, `contact`, `department`, `position`, `createdAt`, `mustChangePassword`
- Supabase table `documents`
  - Columns referenced by the app: `id`, `fileId`, `name`, `type`, `category`, `folder`, `title`, `dateReceived`, `year`, `uploadedAt`
- Supabase table `password_resets`
  - Columns referenced by the app: `id`, `user_id`, `token`, `expires_at`, `verified`
- Supabase Storage bucket
  - Bucket name: `TEMP_UPLOADS_BUCKET` or `temp-uploads`
  - Used by `/api/upload-temp` and `/api/transfer-to-drive`
- Google Drive
  - A refresh token with access to the configured Drive
  - Existing folders matching `DRIVE_ROOT_FOLDER_ID`, `DRIVE_ACADEME_FOLDER_ID`, `DRIVE_STAKEHOLDERS_FOLDER_ID`, and `DRIVE_PAMO_FOLDER_ID`
- SMTP
  - Reachable SMTP server credentials able to send from `SMTP_FROM`

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: create a production build
- `npm run start`: run the production server
- `npm run lint`: run ESLint

## Verification

```bash
npx tsc --noEmit
npm run lint
npm run build
```
