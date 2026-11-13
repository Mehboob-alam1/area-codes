"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/components/admin/client";

interface AdminUser { id: string; fullName: string; email: string; role: string; status: string }

export default function UsersPage() {
  const client = useQueryClient();
  const [error, setError] = useState("");
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => adminFetch<{ data: AdminUser[] }>("/users") });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await adminFetch("/users", { method: "POST", body: JSON.stringify({ fullName: form.get("fullName"), email: form.get("email"), password: form.get("password"), role: form.get("role") }) });
      formElement.reset();
      setError("");
      client.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the user.");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Users and roles</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Super admins can do everything. Admins manage the directory. Editors create and edit. Reviewers verify. Analysts read analytics.</p>
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-2">
        <input name="fullName" required placeholder="Full name" className="h-11 rounded-xl border border-border bg-background px-3" />
        <input name="email" type="email" required placeholder="Email" className="h-11 rounded-xl border border-border bg-background px-3" />
        <input name="password" type="password" required minLength={10} placeholder="Password" className="h-11 rounded-xl border border-border bg-background px-3" />
        <select name="role" className="h-11 rounded-xl border border-border bg-background px-3" defaultValue="editor"><option>super_admin</option><option>admin</option><option>editor</option><option>reviewer</option><option>analyst</option></select>
        {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
        <button className="h-11 rounded-xl bg-primary text-sm font-semibold text-white md:col-span-2">Create user</button>
      </form>
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {users.data?.data.map((user) => (
          <li key={user.id} className="flex justify-between px-4 py-3 text-sm"><span>{user.fullName} · {user.email}</span><span>{user.role}</span></li>
        ))}
      </ul>
    </div>
  );
}
