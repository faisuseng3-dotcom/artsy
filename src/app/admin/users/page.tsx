import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AdminActionButton } from "@/components/admin/action-button";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-paper-raised text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium text-ink">{u.name}</p>
                <p className="text-xs text-ink-muted">{u.email}</p>
              </td>
              <td className="px-4 py-3 text-ink-muted">{u.role}</td>
              <td className="px-4 py-3">
                <Badge tone={u.status === "ACTIVE" ? "success" : "neutral"}>{u.status.toLowerCase()}</Badge>
              </td>
              <td className="px-4 py-3">
                {u.role !== "ADMIN" && (
                  <AdminActionButton
                    url={`/api/admin/users/${u.id}`}
                    body={{ status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }}
                    label={u.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                    confirmMessage={u.status === "ACTIVE" ? "Suspend this user?" : undefined}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
