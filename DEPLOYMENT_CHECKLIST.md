# Deployment Checklist

## Automated checks completed in this repository

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Required environment variables

Set all of these in the deployment environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_REFRESH_TOKEN`
- `DRIVE_ROOT_FOLDER_ID`
- `DRIVE_ACADEME_FOLDER_ID`
- `DRIVE_STAKEHOLDERS_FOLDER_ID`
- `DRIVE_PAMO_FOLDER_ID`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `TEMP_UPLOADS_BUCKET` if you do not want the default `temp-uploads`

## Supabase manual verification

- Confirm table `users` exists with the columns used by the app:
  - `id`, `name`, `email`, `password`, `role`, `avatar`, `userCode`, `firstName`, `middleName`, `lastName`, `suffix`, `birthdate`, `employmentType`, `contact`, `department`, `position`, `createdAt`, `mustChangePassword`
- Confirm table `documents` exists with the columns used by the app:
  - `id`, `fileId`, `name`, `type`, `category`, `folder`, `title`, `dateReceived`, `year`, `uploadedAt`
- Confirm table `password_resets` exists with the columns used by the app:
  - `id`, `user_id`, `token`, `expires_at`, `verified`
- Confirm the service role key can read and write those tables.
- Confirm the storage bucket `TEMP_UPLOADS_BUCKET` exists and the service role key can upload, download, and delete objects in it.

## Google Drive manual verification

- Confirm the OAuth client and refresh token are valid for server-to-server Drive API access.
- Confirm the folder IDs in `DRIVE_ROOT_FOLDER_ID`, `DRIVE_ACADEME_FOLDER_ID`, `DRIVE_STAKEHOLDERS_FOLDER_ID`, and `DRIVE_PAMO_FOLDER_ID` exist in the target Drive.
- Confirm the refresh token has permission to create folders and upload files inside the configured target folders.
- Upload and preview one representative file in each category before go-live.

## SMTP manual verification

- Confirm the SMTP server is reachable from the deployment environment.
- Confirm `SMTP_SECURE` matches the server configuration exactly.
- Confirm `SMTP_FROM` is authorized by the SMTP provider.
- Trigger `/api/auth/forgot-password` for a test account and verify the code email arrives.

## Runtime and hosting verification

- Confirm the deployment target supports Node.js runtime routes and outbound access to Supabase, Google Drive, Google OAuth, and SMTP.
- Confirm the deployment target allows request bodies up to the application limits:
  - direct upload route: 100 MB
  - staged upload route: 50 MB
- Confirm route execution timeouts are sufficient for large-file upload and Drive transfer operations.
- Confirm cookies marked `secure` work correctly behind your production HTTPS and proxy setup.

## Final pre-release checks

- Log in with an admin account.
- Register a staff user.
- Change a password while authenticated.
- Run the forgot-password and reset-password flow end to end.
- Upload a file, preview it, download it, and delete it.
- Verify folder creation works for Stakeholders and PAMO Activity uploads.
