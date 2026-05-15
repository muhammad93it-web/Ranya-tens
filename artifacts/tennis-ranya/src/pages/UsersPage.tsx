import { useState } from "react";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Check, X, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toEnglishDigits } from "@/lib/digits";

interface User {
  id: number;
  username: string;
  role: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useGetUsers({ query: { queryKey: getGetUsersQueryKey() } });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "cashier">("cashier");

  const [editId, setEditId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "cashier">("cashier");
  const [editPassword, setEditPassword] = useState("");

  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    createUser.mutate(
      { data: { username: newUsername, password: newPassword, role: newRole } },
      {
        onSuccess: () => {
          setNewUsername(""); setNewPassword(""); setNewRole("cashier");
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        },
      },
    );
  }

  function handleUpdate(id: number) {
    const data: { role?: "admin" | "cashier"; password?: string } = { role: editRole };
    if (editPassword) data.password = editPassword;
    updateUser.mutate(
      { id, data },
      {
        onSuccess: () => {
          setEditId(null); setEditPassword("");
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        },
      },
    );
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteUser.mutate({ id: pendingDelete.id }, {
      onSuccess: () => {
        setPendingDelete(null);
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      },
    });
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground text-end mb-6 flex items-center justify-end gap-2">
        <span>بەکارهێنەران</span>
        <Users className="text-primary" size={22} />
      </h1>

      {/* Add form */}
      <div className="bg-card border border-card-border rounded-2xl p-6 mb-6">
        <h2 className="text-end text-sm font-semibold text-muted-foreground mb-4">بەکارهێنەری نوێ زیاد بکە</h2>
        <form onSubmit={handleCreate} className="flex gap-3 flex-row-reverse flex-wrap">
          <button type="submit" disabled={createUser.isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            data-testid="button-add-user">
            <Plus size={16} />
            زیادکردن
          </button>
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "cashier")}
            className="px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            data-testid="select-user-role">
            <option value="cashier">کاشێر</option>
            <option value="admin">ئەدمین</option>
          </select>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(toEnglishDigits(e.target.value))}
            placeholder="وشەی نهێنی"
            className="flex-1 min-w-32 px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors text-end"
            data-testid="input-user-password" />
          <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
            placeholder="ناوی بەکارهێنەر"
            className="flex-1 min-w-32 px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors text-end"
            data-testid="input-user-username" />
        </form>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">کردارەکان</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">رۆل</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">ناوی بەکارهێنەر</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[0,1,2].map((j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : (users as User[] ?? []).map((user) => (
              <tr key={user.id} data-testid={`row-user-${user.id}`} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editId === user.id ? (
                      <>
                        <button onClick={() => handleUpdate(user.id)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors" data-testid={`button-save-user-${user.id}`}>
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/30 transition-colors">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setPendingDelete(user)} className="px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 text-xs font-medium" data-testid={`button-delete-user-${user.id}`}>
                          <Trash2 size={14} />
                          <span>سڕینەوە</span>
                        </button>
                        <button onClick={() => { setEditId(user.id); setEditRole(user.role as "admin" | "cashier"); setEditPassword(""); }}
                          className="px-2.5 py-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors flex items-center gap-1.5 text-xs font-medium" data-testid={`button-edit-user-${user.id}`}>
                          <Pencil size={14} />
                          <span>دەستکاری</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-end">
                  {editId === user.id ? (
                    <div className="flex gap-2 justify-end items-center">
                      <input type="password" value={editPassword} onChange={(e) => setEditPassword(toEnglishDigits(e.target.value))}
                        placeholder="وشەی نهێنی نوێ"
                        className="w-32 px-2 py-1 rounded-lg bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-1 focus:ring-primary text-sm" />
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value as "admin" | "cashier")}
                        className="px-2 py-1 rounded-lg bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm">
                        <option value="cashier">کاشێر</option>
                        <option value="admin">ئەدمین</option>
                      </select>
                    </div>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.role === "admin" ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-400"}`}>
                      {user.role === "admin" ? "ئەدمین" : "کاشێر"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-end text-foreground font-medium">{user.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="سڕینەوەی بەکارهێنەر"
        message={`دڵنیایت لە سڕینەوەی بەکارهێنەر "${pendingDelete?.username ?? ""}"؟ ئەم کردارە ناتوانرێت بگەڕێنرێتەوە.`}
        confirmText="بەڵێ، بسڕەوە"
        cancelText="پاشگەزبوونەوە"
        variant="danger"
        icon="trash"
        loading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
