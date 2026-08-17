import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminLogin, adminSession } from "@/lib/supabase-server";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Prince Group Portal" },
      {
        name: "description",
        content: "Restricted access. Sign in to manage Prince Group marriage registrations.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If a session already exists (e.g. the user revisits the login page while
  // still authenticated), send them straight through. This never blocks the
  // form — if the check fails, the form simply remains usable.
  useEffect(() => {
    let cancelled = false;
    adminSession()
      .then((res) => {
        if (!cancelled && res.authed) navigate({ to: "/admin" });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await adminLogin({ data: { username, password } });
      if (!res.ok) {
        toast.error("Invalid username or password.");
        setSubmitting(false);
        return;
      }
      // Sync the legacy client flag too, so any page reading localStorage stays consistent.
      localStorage.setItem("pg_admin_auth", "1");
      toast.success("Welcome back, Admin.");
      await navigate({ to: "/admin" });
    } catch (err) {
      console.error("[admin] login failed", err);
      toast.error("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
        <div className="card-premium relative overflow-hidden p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0 opacity-40"
            style={{
              background:
                "radial-gradient(400px 160px at 50% -20%, rgba(200,169,81,0.35), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[color:var(--olive)]/10 text-primary">
              <img
                src="/prince-logo.png"
                alt="Prince Group of Companies"
                className="h-14 w-14 rounded-full object-cover"
              />
            </div>
            <h1 className="mt-6 text-center font-display text-2xl font-semibold text-foreground">
              Admin Login
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Restricted area. Sign in to manage marriage registrations.
            </p>

            <form onSubmit={submit} className="mt-8 grid gap-5">
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-foreground">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoCapitalize="none"
                  className="h-11 rounded-[12px]"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-11 rounded-[12px] pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-[color:var(--olive-deep)] disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--olive)]" />
              Authorized personnel only · Prince Group of Companies
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
