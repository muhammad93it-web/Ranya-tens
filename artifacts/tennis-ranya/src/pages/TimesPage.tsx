import { useState } from "react";
import { useGetCourts, useCreateSession, getGetCourtsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";

const PRESET_TIMES = [15, 30, 60];

interface Court {
  id: number;
  name: string;
  status: string;
}

export default function TimesPage() {
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  const { data: courts, isLoading } = useGetCourts({
    query: { queryKey: getGetCourtsQueryKey() },
  });
  const createSession = useCreateSession();

  const idleCourts = (courts as Court[] ?? []).filter((c) => c.status === "idle");

  function handlePreset(minutes: number) {
    if (!selectedCourtId) {
      setErrorMsg("تکایە یەک میز هەڵبژێرە");
      return;
    }
    setErrorMsg("");
    createSession.mutate(
      { data: { courtId: selectedCourtId, presetMinutes: minutes } },
      {
        onSuccess: () => {
          setSuccessMsg(`میز دەستی پێکرد بۆ ${minutes} خولەک`);
          setSelectedCourtId(null);
          queryClient.invalidateQueries({ queryKey: getGetCourtsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          setTimeout(() => setSuccessMsg(""), 3000);
        },
        onError: () => {
          setErrorMsg("هەڵە ڕوویدا، دووبارە هەوڵ بدەرەوە");
        },
      },
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground text-end mb-6 flex items-center justify-end gap-2">
        <span>کاتیەکان</span>
        <Clock className="text-primary" size={22} />
      </h1>

      <div className="max-w-lg mx-auto">
        <div className="bg-card border border-card-border rounded-2xl p-6 space-y-6">
          {/* Court selector */}
          <div>
            <label className="block text-sm text-muted-foreground text-end mb-2">میز هەڵبژێرە</label>
            {isLoading ? (
              <div className="h-12 bg-muted/30 rounded-xl animate-pulse" />
            ) : idleCourts.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground text-sm">
                هیچ میزی بەتاڵ نییە
              </div>
            ) : (
              <select
                value={selectedCourtId ?? ""}
                onChange={(e) => setSelectedCourtId(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-end"
                data-testid="select-court"
              >
                <option value="">--- میز هەڵبژێرە ---</option>
                {idleCourts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Preset buttons */}
          <div>
            <p className="text-sm text-muted-foreground text-end mb-3">کات هەڵبژێرە</p>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_TIMES.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => handlePreset(minutes)}
                  disabled={createSession.isPending || !selectedCourtId}
                  className="flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-border bg-muted/20 hover:border-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                  data-testid={`button-preset-${minutes}`}
                >
                  <Clock size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-lg font-bold text-foreground">{minutes}</span>
                  <span className="text-xs text-muted-foreground">خولەک</span>
                </button>
              ))}
            </div>
          </div>

          {successMsg && (
            <div className="py-3 px-4 bg-primary/10 text-primary rounded-xl text-sm text-center border border-primary/20">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="py-3 px-4 bg-destructive/10 text-destructive rounded-xl text-sm text-center border border-destructive/20">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
