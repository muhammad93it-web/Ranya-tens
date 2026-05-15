import { useState, useEffect } from "react";
import {
  useGetSettings,
  useUpdateSettings,
  useSendTelegramReport,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon, Save, Store, Palette, Send, Plus, Minus, X,
  Type as TypeIcon,
} from "lucide-react";
import { toEnglishDigits } from "@/lib/digits";

interface SettingsData {
  id: number;
  systemName: string;
  themeColor: string;
  shopName: string | null;
  marketCategory: string | null;
  phoneNumber: string | null;
  address: string | null;
  fontFamily: string;
  fontSize: string;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  telegramDailyEnabled: boolean;
  telegramMonthlyEnabled: boolean;
  telegramDailyTimes: string[];
}

const COLORS = [
  { value: "amber", className: "bg-amber-500" },
  { value: "teal", className: "bg-teal-500" },
  { value: "red", className: "bg-red-500" },
  { value: "purple", className: "bg-purple-500" },
  { value: "green", className: "bg-green-500" },
  { value: "blue", className: "bg-blue-500" },
  { value: "orange", className: "bg-orange-500" },
];

const FONTS = [
  { value: "default", label: "نۆڕی کیوفی" },
  { value: "sans", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
];

const SIZE_LEGACY: Record<string, number> = { small: 14, medium: 16, large: 18 };
const FONT_MIN = 12;
const FONT_MAX = 50;
function parseFontSize(raw: string | undefined): number {
  if (!raw) return 16;
  const legacy = SIZE_LEGACY[raw];
  const n = legacy ?? parseInt(raw, 10);
  if (Number.isNaN(n)) return 16;
  return Math.max(FONT_MIN, Math.min(FONT_MAX, n));
}

function Toggle({ on, onChange, testId }: { on: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} data-testid={testId}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}>
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ insetInlineStart: on ? "calc(100% - 1.375rem)" : "0.125rem" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const updateSettings = useUpdateSettings();
  const sendTelegram = useSendTelegramReport();

  const [form, setForm] = useState<SettingsData | null>(null);
  const [saved, setSaved] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [sendStart, setSendStart] = useState("");
  const [sendEnd, setSendEnd] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setForm(settings as SettingsData);
  }, [settings]);

  function patch<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    if (!form) return;
    setForm({ ...form, [key]: value });
  }

  function handleSave() {
    if (!form) return;
    updateSettings.mutate({ data: buildPayload(form) }, {
      onSuccess: () => {
        setSaved(true);
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        setTimeout(() => setSaved(false), 2500);
      },
    });
  }

  function addTime() {
    if (!form || !newTime || !/^\d{1,2}:\d{2}$/.test(newTime)) return;
    if (form.telegramDailyTimes.includes(newTime)) return;
    patch("telegramDailyTimes", [...form.telegramDailyTimes, newTime].sort());
    setNewTime("");
  }

  function removeTime(t: string) {
    if (!form) return;
    patch("telegramDailyTimes", form.telegramDailyTimes.filter((x) => x !== t));
  }

  function buildPayload(f: SettingsData) {
    return {
      systemName: f.systemName,
      themeColor: f.themeColor,
      shopName: f.shopName ?? "",
      marketCategory: f.marketCategory ?? "",
      phoneNumber: f.phoneNumber ?? "",
      address: f.address ?? "",
      fontFamily: f.fontFamily,
      fontSize: f.fontSize,
      telegramBotToken: f.telegramBotToken ?? "",
      telegramChatId: f.telegramChatId ?? "",
      telegramDailyEnabled: f.telegramDailyEnabled,
      telegramMonthlyEnabled: f.telegramMonthlyEnabled,
      telegramDailyTimes: f.telegramDailyTimes,
    };
  }

  function saveThen(action: () => void) {
    if (!form) return;
    updateSettings.mutate({ data: buildPayload(form) }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        action();
      },
      onError: () => {
        setFeedback("هەڵە لە پاشەکەوتکردنی ڕێکخستن");
        setTimeout(() => setFeedback(null), 4000);
      },
    });
  }

  function sendNow() {
    if (!form?.telegramBotToken || !form?.telegramChatId) {
      setFeedback("تکایە سەرەتا بۆت تۆکێن و چات ئایدی پڕبکەرەوە");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    saveThen(() => {
      sendTelegram.mutate({ data: {} }, {
        onSuccess: () => {
          setFeedback("ڕاپۆرتی ئەمڕۆ نێردرا ✓");
          setTimeout(() => setFeedback(null), 3000);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "هەڵە";
          setFeedback(`نەنێردرا: ${msg}`);
          setTimeout(() => setFeedback(null), 5000);
        },
      });
    });
  }

  function sendCustom() {
    if (!sendStart || !sendEnd) return;
    if (!form?.telegramBotToken || !form?.telegramChatId) {
      setFeedback("تکایە سەرەتا بۆت تۆکێن و چات ئایدی پڕبکەرەوە");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    saveThen(() => {
      sendTelegram.mutate({ data: { startDate: sendStart, endDate: sendEnd } }, {
        onSuccess: () => {
          setFeedback("ڕاپۆرت نێردرا ✓");
          setTimeout(() => setFeedback(null), 3000);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "هەڵە";
          setFeedback(`نەنێردرا: ${msg}`);
          setTimeout(() => setFeedback(null), 5000);
        },
      });
    });
  }

  if (isLoading || !form) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-card-border rounded-2xl p-8 animate-pulse">
          <div className="space-y-4">
            {[1,2,3,4,5,6].map((i) => <div key={i} className="h-10 bg-muted/50 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleSave} disabled={updateSettings.isPending}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          data-testid="button-save-settings">
          <Save size={16} />
          <span>{saved ? "پاشەکەوت کرا ✓" : "پاشەکەوتکردن"}</span>
        </button>
        <div className="text-end">
          <h1 className="text-xl font-bold text-foreground flex items-center justify-end gap-2">
            <span>ڕێکخستنەکان</span>
            <SettingsIcon className="text-primary" size={22} />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">ڕێکخستنی سیستەمەکە</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Store info */}
        <section className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-foreground text-end mb-5 flex items-center justify-end gap-2 border-b border-border pb-3">
            <span>زانیاری سیستەمی تێنسی ڕانیە</span>
            <Store size={16} className="text-primary" />
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground text-end mb-1.5">ژمارەی تەلەفۆن</label>
              <input type="text" value={form.phoneNumber ?? ""}
                onChange={(e) => patch("phoneNumber", toEnglishDigits(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-phone" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground text-end mb-1.5">ناوی سیستەم</label>
              <input type="text" value={form.shopName ?? ""}
                onChange={(e) => patch("shopName", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-system-name" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground text-end mb-1.5">ناونیشان</label>
              <input type="text" value={form.address ?? ""}
                onChange={(e) => patch("address", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-address" />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-foreground text-end mb-5 flex items-center justify-end gap-2 border-b border-border pb-3">
            <span>ڕووکاری</span>
            <Palette size={16} className="text-primary" />
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs text-muted-foreground text-end mb-2">ڕەنگی سەرەکی</label>
              <div className="flex gap-2 justify-end flex-row-reverse">
                {COLORS.map((c) => (
                  <button key={c.value} type="button" onClick={() => patch("themeColor", c.value)}
                    className={`w-9 h-9 rounded-lg ${c.className} ${form.themeColor === c.value ? "ring-2 ring-offset-2 ring-offset-card ring-foreground" : ""}`}
                    data-testid={`color-${c.value}`} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground text-end mb-1.5">قەبارەی فۆنت</label>
                <div className="flex items-center gap-2">
                  <button type="button" data-testid="button-font-bigger"
                    onClick={() => {
                      const n = parseFontSize(form.fontSize);
                      if (n < FONT_MAX) patch("fontSize", String(n + 1));
                    }}
                    disabled={parseFontSize(form.fontSize) >= FONT_MAX}
                    className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus size={16} className="mx-auto" />
                  </button>
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end text-sm flex items-center justify-between" dir="ltr">
                    <TypeIcon size={14} className="text-muted-foreground" />
                    <span className="font-mono">{parseFontSize(form.fontSize)}px</span>
                  </div>
                  <button type="button" data-testid="button-font-smaller"
                    onClick={() => {
                      const n = parseFontSize(form.fontSize);
                      if (n > FONT_MIN) patch("fontSize", String(n - 1));
                    }}
                    disabled={parseFontSize(form.fontSize) <= FONT_MIN}
                    className="w-9 h-9 rounded-lg bg-muted/30 border border-input text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Minus size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground text-end mb-1.5">فۆنت</label>
                <select value={form.fontFamily} onChange={(e) => patch("fontFamily", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="select-font">
                  {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Telegram */}
        <section className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-foreground text-end mb-5 flex items-center justify-end gap-2 border-b border-border pb-3">
            <span>تێلێگرام — نێردنی ڕاپۆرت</span>
            <Send size={16} className="text-primary" />
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs text-muted-foreground text-end mb-1.5">چات ئایدی یان ناوی کەناڵ</label>
              <input type="text" value={form.telegramChatId ?? ""}
                onChange={(e) => patch("telegramChatId", e.target.value)}
                placeholder="-100123456789"
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
                data-testid="input-chat-id" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground text-end mb-1.5">بۆت تۆکێن</label>
              <input type="text" value={form.telegramBotToken ?? ""}
                onChange={(e) => patch("telegramBotToken", e.target.value)}
                placeholder="123456:ABCdef..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-sm"
                data-testid="input-bot-token" />
            </div>
          </div>

          {/* Daily toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border mb-3">
            <Toggle on={form.telegramDailyEnabled} onChange={(v) => patch("telegramDailyEnabled", v)} testId="toggle-daily" />
            <div className="text-end">
              <p className="text-sm font-semibold text-foreground">ڕاپۆرتی ڕۆژانە ئۆتۆماتیکی</p>
              <p className="text-xs text-muted-foreground mt-0.5">هەموو ڕۆژێک کاتەکانی دیاریکراو دەنێردرێت</p>
            </div>
          </div>

          {/* Monthly toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border mb-3">
            <Toggle on={form.telegramMonthlyEnabled} onChange={(v) => patch("telegramMonthlyEnabled", v)} testId="toggle-monthly" />
            <div className="text-end">
              <p className="text-sm font-semibold text-foreground">ڕاپۆرتی مانگانە ئۆتۆماتیکی</p>
              <p className="text-xs text-muted-foreground mt-0.5">لە ڕۆژی یەکەمی هەر مانگێک ڕاپۆرتی مانگی پێشوو دەنێردرێت</p>
            </div>
          </div>

          {/* Daily times list */}
          {form.telegramDailyEnabled && (
            <div className="p-4 rounded-xl bg-muted/20 border border-border mb-3">
              <p className="text-sm font-semibold text-foreground text-end mb-1">کاتە جیاوازەکانی نێردنی ڕاپۆرتی ڕۆژانە</p>
              <p className="text-xs text-muted-foreground text-end mb-3">بۆ نموونە ۲۲:۰۰ یان ٢٣:٠٠</p>
              <div className="flex gap-2 mb-3 flex-row-reverse">
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="input-new-time" />
                <button type="button" onClick={addTime}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90">
                  <Plus size={14} />
                  <span>زیادکردن</span>
                </button>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {form.telegramDailyTimes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">هیچ کاتێک زیاد نەکراوە</p>
                ) : form.telegramDailyTimes.map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm flex items-center gap-1.5">
                    <button onClick={() => removeTime(t)} className="hover:text-destructive"><X size={12} /></button>
                    <span className="font-mono">{t}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Send now */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-3">
            <div className="flex items-center justify-between">
              <button type="button" onClick={sendNow} disabled={sendTelegram.isPending}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                data-testid="button-send-now">
                <Send size={14} />
                <span>ئێستا بنێرە</span>
              </button>
              <div className="text-end">
                <p className="text-sm font-semibold text-foreground">نێردنی ڕاپۆرتی ئەمڕۆ — ئێستا</p>
                <p className="text-xs text-muted-foreground mt-0.5">داهات، خەرجی و قازانجی ئەمڕۆ دەنێردرێت</p>
              </div>
            </div>
          </div>

          {/* Custom range send */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border">
            <p className="text-sm font-semibold text-foreground text-end mb-1">نێردنی ڕاپۆرتی ماوەی دیاریکراو</p>
            <p className="text-xs text-muted-foreground text-end mb-3">بەرواری دەستپێک و کۆتایی دیاری بکە بۆ نێردنی ڕاپۆرت بەو ماوەیە بۆ تێلێگرام</p>
            <div className="flex gap-2 flex-row-reverse">
              <input type="date" value={sendStart} onChange={(e) => setSendStart(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-send-start" />
              <input type="date" value={sendEnd} onChange={(e) => setSendEnd(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-muted/30 border border-input text-foreground text-end focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-send-end" />
              <button type="button" onClick={sendCustom} disabled={!sendStart || !sendEnd || sendTelegram.isPending}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50">
                <Send size={14} />
                <span>بنێرە</span>
              </button>
            </div>
          </div>

          {feedback && (
            <div className="mt-3 p-3 rounded-xl bg-card border border-border text-end text-sm text-foreground">
              {feedback}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
