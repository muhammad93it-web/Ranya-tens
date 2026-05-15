import { useState } from "react";
import {
  useGetTimePresets,
  useCreateTimePreset,
  useUpdateTimePreset,
  useDeleteTimePreset,
  getGetTimePresetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

interface TimePreset {
  id: number;
  label: string;
  minutes: number;
}

export default function TimesPage() {
  const { user } = useUser();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const { data: presets, isLoading } = useGetTimePresets({
    query: { queryKey: getGetTimePresetsQueryKey() },
  });
  const createPreset = useCreateTimePreset();
  const updatePreset = useUpdateTimePreset();
  const deletePreset = useDeleteTimePreset();

  const [newLabel, setNewLabel] = useState("");
  const [newMinutes, setNewMinutes] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editMinutes, setEditMinutes] = useState("");

  function refresh() {
    queryClient.invalidateQueries({ queryKey: getGetTimePresetsQueryKey() });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const min = Number(newMinutes);
    if (!newLabel.trim() || !min || min <= 0) return;
    createPreset.mutate(
      { data: { label: newLabel.trim(), minutes: min } },
      {
        onSuccess: () => {
          setNewLabel("");
          setNewMinutes("");
          refresh();
        },
      },
    );
  }

  function startEdit(p: TimePreset) {
    setEditId(p.id);
    setEditLabel(p.label);
    setEditMinutes(String(p.minutes));
  }

  function handleUpdate() {
    if (!editId) return;
    const min = Number(editMinutes);
    if (!editLabel.trim() || !min || min <= 0) return;
    updatePreset.mutate(
      { id: editId, data: { label: editLabel.trim(), minutes: min } },
      {
        onSuccess: () => {
          setEditId(null);
          refresh();
        },
      },
    );
  }

  function handleDelete(id: number) {
    if (!confirm("دڵنیایت لە سڕینەوەی ئەم کاتە؟")) return;
    deletePreset.mutate({ id }, { onSuccess: refresh });
  }

  const list = (presets as TimePreset[] ?? []);

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground text-end mb-6 flex items-center justify-end gap-2">
        <span>کاتەکان</span>
        <Clock className="text-primary" size={22} />
      </h1>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Add new preset (admin only) */}
        {isAdmin && (
          <form
            onSubmit={handleCreate}
            className="bg-card border border-card-border rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                زیادکردنی کاتی نوێ
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="ناوی کات (نموونە: نیو کاتژمێر)"
                className="px-3 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-end"
                data-testid="input-preset-label"
              />
              <input
                type="number"
                min="1"
                value={newMinutes}
                onChange={(e) => setNewMinutes(e.target.value)}
                placeholder="خولەک"
                className="px-3 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-end"
                data-testid="input-preset-minutes"
              />
              <button
                type="submit"
                disabled={createPreset.isPending}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50"
                data-testid="button-add-preset"
              >
                <Plus size={16} />
                زیادکردن
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {list.length} کات
            </span>
            <h2 className="text-sm font-semibold text-foreground">لیستی کاتە سەرەکییەکان</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">چاوەڕوان بە...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">هیچ کاتێک نییە</div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((p) => (
                <li key={p.id} className="px-5 py-4 flex items-center gap-3" data-testid={`preset-row-${p.id}`}>
                  {editId === p.id ? (
                    <>
                      <button
                        onClick={() => setEditId(null)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={updatePreset.isPending}
                        className="p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50"
                        data-testid={`button-save-${p.id}`}
                      >
                        <Check size={16} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-lg bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </>
                  ) : (
                    <>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            data-testid={`button-delete-${p.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => startEdit(p)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            data-testid={`button-edit-${p.id}`}
                          >
                            <Pencil size={16} />
                          </button>
                        </>
                      )}
                      <div className="flex-1 flex items-center justify-end gap-3">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                          {p.minutes} خولەک
                        </span>
                        <span className="text-foreground font-medium">{p.label}</span>
                        <Clock size={16} className="text-muted-foreground" />
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!isAdmin && (
          <p className="text-xs text-muted-foreground text-center">
            تەنها ئەدمین دەتوانێت کات زیاد بکات یان دەستکاری بکات
          </p>
        )}
      </div>
    </div>
  );
}
