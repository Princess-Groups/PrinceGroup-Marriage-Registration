import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  FileCheck2,
  Loader2,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Users2,
  Wallet,
} from "lucide-react";
import { adminLogout, adminSession, listRegistrations } from "@/lib/supabase-server";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Prince Group Portal" },
      {
        name: "description",
        content: "Prince Group admin dashboard for managing marriage registration applications.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AuthState = "unknown" | "authed" | "anon";

function AdminPage() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState>("unknown");
  const [subs, setSubs] = useState<
    {
      registration_id: string;
      bride_name: string | null;
      groom_name: string | null;
      district: string | null;
      payment_status: string | null;
      status: string | null;
      uploaded_docs: number;
      created_at: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Auth guard — verify the session cookie on the server. The SSR request
  // middleware already redirects unauthenticated page loads to /admin/login,
  // so this client check only covers in-app navigation.
  useEffect(() => {
    let cancelled = false;
    adminSession()
      .then((res) => {
        if (cancelled) return;
        if (!res.authed) {
          navigate({ to: "/admin/login" });
          setAuth("anon");
        } else {
          setAuth("authed");
        }
      })
      .catch(() => {
        if (cancelled) return;
        navigate({ to: "/admin/login" });
        setAuth("anon");
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    listRegistrations()
      .then((rows) => {
        if (!cancelled) setSubs(rows);
      })
      .catch((err) => {
        console.error("[supabase] listRegistrations failed", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // While the auth state is being resolved, render a spinner so the dashboard
  // never flashes content to an unauthenticated visitor.
  if (auth === "unknown") {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (auth === "anon") return null; // redirect already fired

  function logout() {
    localStorage.removeItem("pg_admin_auth");
    adminLogout()
      .then(() => navigate({ to: "/admin/login" }))
      .catch(() => navigate({ to: "/admin/login" }));
  }

  const today = new Date().toDateString();
  const stats = [
    { label: "Total Registrations", value: subs.length, icon: Users2 },
    {
      label: "Today's Registrations",
      value: subs.filter((s) => new Date(s.created_at ?? "").toDateString() === today).length,
      icon: TrendingUp,
    },
    {
      label: "Pending Payments",
      value: subs.filter((s) => s.payment_status !== "paid").length,
      icon: Wallet,
    },
    { label: "Completed Cases", value: 0, icon: FileCheck2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--olive-deep)]">
              Prince Group · Internal
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of recent marriage registration applications.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--olive)]/30 bg-[color:var(--cream)] px-3 py-1.5 text-xs font-medium text-[color:var(--olive-deep)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--olive)]" />
              Signed in as BeemBoy
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-[12px] border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card-premium p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {s.label}
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[color:var(--olive)]/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 font-display text-3xl font-semibold text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 card-premium overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-[color:var(--cream)]/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                Recent Registrations
              </h2>
            </div>
            <div className="text-xs text-muted-foreground">
              {loading
                ? "Loading…"
                : `Showing ${subs.length} record${subs.length === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background text-left">
                <tr className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-3">Reg ID</th>
                  <th className="px-4 py-3">Bride</th>
                  <th className="px-4 py-3">Groom</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Docs</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading registrations…
                      </span>
                    </td>
                  </tr>
                )}
                {!loading && subs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      No registrations yet. Complete the customer flow to see entries here.
                    </td>
                  </tr>
                )}
                {subs.map((s) => (
                  <tr key={s.registration_id} className="hover:bg-secondary/60">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {s.registration_id}
                    </td>
                    <td className="px-4 py-3">{s.bride_name || "—"}</td>
                    <td className="px-4 py-3">{s.groom_name || "—"}</td>
                    <td className="px-4 py-3">{s.district || "—"}</td>
                    <td className="px-4 py-3">{s.uploaded_docs}/12</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          s.payment_status === "paid"
                            ? "inline-flex rounded-full bg-[color:var(--olive)]/10 px-2 py-0.5 text-xs font-semibold text-primary"
                            : "inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive"
                        }
                      >
                        {s.payment_status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                        {s.status || "new"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
