import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useUser } from "@/contexts/UserContext";
import { Trophy, Eye, EyeOff } from "lucide-react";

type Role = "admin" | "cashier";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { setUser } = useUser();
  const loginMutation = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const username = role === "admin" ? "admin" : "cashier";
    loginMutation.mutate(
      { data: { username, password, role } },
      {
        onSuccess: (data) => {
          setUser(data.user as { id: number; username: string; role: "admin" | "cashier" });
          setLocation("/dashboard");
        },
        onError: () => {
          setError("وشەی نهێنی هەڵەیە");
        },
      },
    );
  }

  function handleRoleChange(newRole: Role) {
    setRole(newRole);
    setPassword("");
    setError("");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="text-primary" size={36} />
            <h1 className="text-3xl font-bold text-foreground">Tennis Ranya</h1>
          </div>
          <p className="text-muted-foreground text-sm">جۆری لەکاونت هەڵبژێرە و پاسۆرد داخڵ بکە</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-xl">

          {/* Role selector */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange("cashier")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "cashier"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border bg-muted/30 hover:border-muted-foreground/30"
                }`}
                data-testid="button-role-cashier"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  role === "cashier" ? "bg-amber-500" : "bg-muted"
                }`}>
                  🏓
                </div>
                <div className="text-center">
                  <p className={`font-semibold text-sm ${role === "cashier" ? "text-amber-400" : "text-foreground"}`}>
                    کاشێر
                  </p>
                  <p className="text-muted-foreground text-xs">بەڕێوەبردنی میزەکان</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("admin")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "admin"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-muted-foreground/30"
                }`}
                data-testid="button-role-admin"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  role === "admin" ? "bg-primary" : "bg-muted"
                }`}>
                  🛡️
                </div>
                <div className="text-center">
                  <p className={`font-semibold text-sm ${role === "admin" ? "text-primary" : "text-foreground"}`}>
                    ئەدمین
                  </p>
                  <p className="text-muted-foreground text-xs">بەڕێوەبەری سیستەم</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password only */}
            <div>
              <label className="block text-sm text-muted-foreground text-end mb-1">
                پاسۆردی{" "}
                <span className={role === "admin" ? "text-primary font-semibold" : "text-amber-400 font-semibold"}>
                  {role === "admin" ? "ئەدمین" : "کاشێر"}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  className="w-full px-4 py-3 pe-12 rounded-xl bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-center tracking-widest text-lg"
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={`w-full py-3 rounded-xl font-semibold text-base hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 ${
                role === "admin"
                  ? "bg-primary text-primary-foreground"
                  : "bg-amber-500 text-white"
              }`}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <span className="animate-spin">⟳</span>
              ) : null}
              چوونەژووەروەوە
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
