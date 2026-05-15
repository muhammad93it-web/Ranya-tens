import { useState } from "react";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Check, X, Users, Shield } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toEnglishDigits } from "@/lib/digits";

interface User {
  id: number;
  username: string;
  role: "admin" | "cashier";
  permissions: string[];
}

const CASHIER_PAGES = [
  { path: "/map", label: "نەخشەی مێزەکان" },
  { path: "/dashboard", label: "داشبۆرد" },
  { path: "/times", label: "کاتەکان" },
  { path: "/reports", label: "ڕاپۆرتەکان" },
  { path: "/expenses", label: "خەرجییەکان" },
];

const DEFAULT_PERMISSIONS = CASHIER_PAGES.map((p) => p.path);

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useGetUsers({ query: { queryKey: getGetUsersQueryKey() } });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Add form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "cashier">("cashier");
  const [newPermissions, setNewPermissions] = useState<string[]>(DEFAULT_PERMISSIONS);

  // Edit (modal)
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "cashier">("cashier");
  const [editPassword, setEditPassword] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>(DEFAULT_PERMISSIONS);

  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    createUser.mutate(
      {
        data: {
          username: newUsername,
          password: newPassword,
          role: newRole,
          permissions: newRole === "cashier" ? newPermissions : DEFAULT_PERMISSIONS,
        },
      },
      {
        onSuccess: () => {
          setNewUsername(""); setNewPassword(""); setNewRole("cashier");
          setNewPermissions(DEFAULT_PERMISSIONS);
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        },
      },
    );
  }

  function openEdit(u: User) {
    setEditUser(u);
    setEditRole(u.role);
    setEditPassword("");
    setEditPermissions(u.permissions ?? DEFAULT_PERMISSIONS);
  }

  function handleSaveEdit() {
    if (!editUser) return;
    const data: { role?: "admin" | "cashier"; password?: string; permissions?: string[] } = {
      role: editRole,
      permissions: editRole === "cashier" ? editPermissions : DEFAULT_PERMISSIONS,
    };
    if (editPassword) data.password = editPassword;
    updateUser.mutate(
      { id: editUser.id, data },
      {
        onSuccess: () => {
          setEditUser(null);
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

  function togglePermission(arr: string[], path: string, setter: (v: string[]) => void) {
    setter(arr.includes(path) ? arr.filter((p) => p !== path) : [...arr, path]);
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
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-3 flex-row-reverse flex-wrap">
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
          </div>

          {newRole === "cashier" && (
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <p className="text-end text-xs text-muted-foreground mb-3 flex items-center justify-end gap-1.5">
                <span>دەسەڵاتەکانی کاشێر — دیاریبکە کام بەش دەبینێت</span>
                <Shield size={14} className="text-primary" />
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CASHIER_PAGES.map((p) => {
                  const checked = newPermissions.includes(p.path);
                  return (
                    <label key={p.path} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-card border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                      <input type="checkbox" checked={checked}
                        onChange={() => togglePermission(newPermissions, p.path, setNewPermissions)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                        data-testid={`new-permission-${p.path.replace("/", "")}`} />
                      <span className="text-foreground text-sm text-end">{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <button type="submit" disabled={createUser.isPending}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="button-add-user">
              <Plus size={16} />
              زیادکردن
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">کردارەکان</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">دەسەڵاتەکان</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">رۆل</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground">ناوی بەکارهێنەر</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[0,1,2,3].map((j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : (users as User[] ?? []).map((u) => (
              <tr key={u.id} data-testid={`row-user-${u.id}`} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPendingDelete(u)}
                      className="px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 text-xs font-medium"
                      data-testid={`button-delete-user-${u.id}`}>
                      <Trash2 size={14} />
                      <span>سڕینەوە</span>
                    </button>
                    <button onClick={() => openEdit(u)}
                      className="px-2.5 py-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors flex items-center gap-1.5 text-xs font-medium"
                      data-testid={`button-edit-user-${u.id}`}>
                      <Pencil size={14} />
                      <span>دەستکاری</span>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-end text-xs text-muted-foreground">
                  {u.role === "admin" ? (
                    <span className="text-primary">هەموو بەشەکان</span>
                  ) : (
                    <span>{(u.permissions ?? []).length} بەش</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === "admin" ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-400"}`}>
                    {u.role === "admin" ? "ئەدمین" : "کاشێر"}
                  </span>
                </td>
                <td className="px-4 py-3 text-end text-foreground font-medium">{u.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setEditUser(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
            className="relative w-full max-w-lg bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="bg-accent/90 px-5 py-3.5 flex items-center justify-between">
              <button onClick={() => setEditUser(null)} className="text-white/80 hover:text-white"><X size={18} /></button>
              <h3 className="text-base font-bold text-white text-end">دەستکاری بەکارهێنەر: {editUser.username}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground text-end mb-1.5">رۆل</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value as "admin" | "cashier")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="cashier">کاشێر</option>
                    <option value="admin">ئەدمین</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground text-end mb-1.5">وشەی نهێنی نوێ (لەختیاری)</label>
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(toEnglishDigits(e.target.value))}
                    placeholder="بەتاڵ بهێڵە بۆ نەگۆڕینی"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {editRole === "cashier" && (
                <div className="p-4 rounded-xl bg-muted/20 border border-border">
                  <p className="text-end text-xs text-muted-foreground mb-3 flex items-center justify-end gap-1.5">
                    <span>دەسەڵاتەکانی ئەم کاشێرە</span>
                    <Shield size={14} className="text-primary" />
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CASHIER_PAGES.map((p) => {
                      const checked = editPermissions.includes(p.path);
                      return (
                        <label key={p.path} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-card border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                          <input type="checkbox" checked={checked}
                            onChange={() => togglePermission(editPermissions, p.path, setEditPermissions)}
                            className="w-4 h-4 rounded accent-primary cursor-pointer"
                            data-testid={`edit-permission-${p.path.replace("/", "")}`} />
                          <span className="text-foreground text-sm text-end">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setEditUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-muted/40 text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted/60 transition-colors">
                  <X size={16} />
                  <span>پاشگەزبوونەوە</span>
                </button>
                <button onClick={handleSaveEdit} disabled={updateUser.isPending}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  data-testid="button-save-edit-user">
                  <Check size={16} />
                  <span>{updateUser.isPending ? "..." : "پاشەکەوتکردن"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
