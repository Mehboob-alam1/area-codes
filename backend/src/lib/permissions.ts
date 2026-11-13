import type { AdminRole } from "../types";

const grants: Record<AdminRole, string[]> = {
  super_admin: ["*"],
  admin: [
    "records:read",
    "records:write",
    "records:delete",
    "records:verify",
    "import",
    "export",
    "audit:read",
    "settings:write",
    "users:read",
    "analytics:read",
  ],
  editor: ["records:read", "records:write", "import", "export"],
  reviewer: ["records:read", "records:verify", "audit:read"],
  analyst: ["records:read", "analytics:read", "audit:read"],
};

export function hasPermission(role: string, permission: string) {
  const allowed = grants[role as AdminRole] || [];
  return allowed.includes("*") || allowed.includes(permission);
}
