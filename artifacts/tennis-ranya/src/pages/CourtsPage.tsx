import { useState } from "react";
import { useGetCourts, useCreateCourt, useUpdateCourt, useDeleteCourt, getGetCourtsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Check, X, Table2 } from "lucide-react";

interface Court {
  id: number;
  name: string;
  hourlyRate: number;
  status: string;
}

export default function CourtsPage() {
  const queryClient = useQueryClient();
  const { data: courts, isLoading } = useGetCourts({ query: { queryKey: getGetCourtsQueryKey() } });
  const createCourt = useCreateCourt();
  const updateCourt = useUpdateCourt();
  const deleteCourt = useDeleteCourt();

  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newRate) return;
    createCourt.mutate(
      { data: { name: newName, hourlyRate: Number(newRate) } },
      {
        onSuccess: () => {
          setNewName("");
          setNewRate("");
          queryClient.invalidateQueries({ queryKey: getGetCourtsQueryKey() });
        },
      },
    );
  }

  function startEdit(court: Court) {
    setEditId(court.id);
    setEditName(court.name);
    setEditRate(String(court.hourlyRate));
  }

  function handleUpdate() {
    if (!editId) return;
    updateCourt.mutate(
      { id: editId, data: { name: editName, hourlyRate: Number(editRate) } },
      {
        onSuccess: () => {
          setEditId(null);
          queryClient.invalidateQueries({ queryKey: getGetCourtsQueryKey() });
        },
      },
    );
  }

  function handleDelete(id: number) {
    if (!confirm("دڵنیایت لە سڕینەوەی ئەم میزە؟")) return;
    deleteCourt.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCourtsQueryKey() }),
    });
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground text-end mb-6 flex items-center justify-end gap-2">
        <span>بەڕێوەبردنی میزەکان</span>
        <Table2 className="text-primary" size={22} />
      </h1>

      {/* Add form */}
      <div className="bg-card border border-card-border rounded-2xl p-6 mb-6">
        <h2 className="text-end text-sm font-semibold text-muted-foreground mb-4">میزی نوێ زیاد بکە</h2>
        <form onSubmit={handleCreate} className="flex gap-3 flex-row-reverse">
          <button
            type="submit"
            disabled={createCourt.isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            data-testid="button-add-court"
          >
            <Plus size={16} />
            زیادکردن
          </button>
          <input
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            placeholder="نرخ خولەک (د.ع)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-end"
            data-testid="input-court-rate"
            min={0}
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="ناوی میز"
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-end"
            data-testid="input-court-name"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wider">کردارەکان</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wider">حاڵەت</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wider">نرخ خولەک (د.ع)</th>
              <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wider">ناوی میز</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[0,1,2,3].map((j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted/50 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (courts as Court[] ?? []).map((court) => (
              <tr key={court.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editId === court.id ? (
                      <>
                        <button onClick={handleUpdate} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors" data-testid={`button-save-${court.id}`}>
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/30 transition-colors">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleDelete(court.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" data-testid={`button-delete-court-${court.id}`}>
                          <Trash2 size={16} />
                        </button>
                        <button onClick={() => startEdit(court)} className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors" data-testid={`button-edit-court-${court.id}`}>
                          <Pencil size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-end">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${court.status === "active" ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"}`}>
                    {court.status === "active" ? "گیراو" : "بەتاڵ"}
                  </span>
                </td>
                <td className="px-4 py-3 text-end text-foreground">
                  {editId === court.id ? (
                    <input type="number" value={editRate} onChange={(e) => setEditRate(e.target.value)}
                      className="w-24 px-2 py-1 rounded-lg bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-1 focus:ring-primary" />
                  ) : (
                    <span>{court.hourlyRate} د.ع</span>
                  )}
                </td>
                <td className="px-4 py-3 text-end text-foreground font-medium">
                  {editId === court.id ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-1 focus:ring-primary" />
                  ) : (
                    court.name
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
