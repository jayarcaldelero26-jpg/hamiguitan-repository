"use client";

import { useEffect } from "react";

export default function AdminPage() {
  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((user) => {
        if (user.role !== "admin") {
          window.location.href = "/dashboard";
        }
      });
  }, []);

  
  return <div>Admin Panel</div>;
}