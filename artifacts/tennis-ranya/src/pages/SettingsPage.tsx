import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Settings, Save } from "lucide-react";

const THEME_OPTIONS = [
  { value: "dark-blue", label: "شینی تاریک" },
  { value: "dark-gray", label: "خۆڵەمێشی تاریک" },
  { value: "dark-purple", label: "مۆری تاریک" },
];

interface SettingsData {
  id: number;
  systemName: string;
  themeColor: string;
  telegramApiKey: string | null;
  discordWebhookUrl: string | null;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const updateSettings = useUpdateSettings();

  const [systemName, setSystemName] = useState("");
  const [themeColor, setThemeColor] = useState("dark-blue");
  const [telegramKey, setTelegramKey] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [saved, setSaved] = useState(false);

  const s = settings as SettingsData | undefined;

  useEffect(() => {
    if (s) {
      setSystemName(s.systemName);
      setThemeColor(s.themeColor);
      setTelegramKey(s.telegramApiKey ?? "");
      setDiscordUrl(s.discordWebhookUrl ?? "");
    }
  }, [settings]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings.mutate(
      {
        data: {
          systemName,
          themeColor,
          telegramApiKey: telegramKey,
          discordWebhookUrl: discordUrl,
        },
      },
      {
        onSuccess: () => {
          setSaved(true);
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          setTimeout(() => setSaved(false), 3000);
        },
      },
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground text-end mb-6 flex items-center justify-end gap-2">
        <span>ڕێکخستنەکان</span>
        <Settings className="text-primary" size={22} />
      </h1>

      {isLoading ? (
        <div className="bg-card border border-card-border rounded-2xl p-8 animate-pulse">
          <div className="space-y-4">
            {[1,2,3,4].map((i) => <div key={i} className="h-10 bg-muted/50 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-lg mx-auto space-y-5">
          <div className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground text-end border-b border-border pb-3">ڕێکخستنی گشتی</h2>

            <div>
              <label className="block text-sm text-muted-foreground text-end mb-2">ناوی سیستەمەکە</label>
              <input type="text" value={systemName} onChange={(e) => setSystemName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors text-end"
                data-testid="input-system-name" />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground text-end mb-2">ڕەنگی ڕووکاری</label>
              <div className="flex gap-3 justify-end">
                {THEME_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setThemeColor(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${themeColor === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/40"}`}
                    data-testid={`button-theme-${opt.value}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground text-end border-b border-border pb-3">بەستنە بە پلاتفۆرمەکان</h2>

            <div>
              <label className="block text-sm text-muted-foreground text-end mb-2">Telegram API Key</label>
              <input type="text" value={telegramKey} onChange={(e) => setTelegramKey(e.target.value)}
                placeholder="..."
                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors font-mono text-sm"
                data-testid="input-telegram-key" />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground text-end mb-2">Discord Webhook URL</label>
              <input type="text" value={discordUrl} onChange={(e) => setDiscordUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors font-mono text-sm"
                data-testid="input-discord-url" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={updateSettings.isPending}
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="button-save-settings">
              <Save size={18} />
              {saved ? "پاشەکەوت کرا" : "پاشەکەوتکردن"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
