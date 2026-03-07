"use client";

import { UsersProvider } from "@/app/components/UsersProvider";
import RegisteredUsersPage from "./RegisteredUsersPage";

export default function Page() {
  return (
    <UsersProvider>
      <RegisteredUsersPage />
    </UsersProvider>
  );
}