import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  FileCheck2,
  Loader2,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Users2,
  Wallet,
} from "lucide-react";
import {
  adminLogout,
  adminSession,
  listRegistrations,
  type RegistrationRow,
} from "@/lib/supabase-server";
import { cn } from "@/lib/utils";

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
  const [subs, setSubs] = useState<RegistrationRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
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
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading registrations…
                      </span>
                    </td>
                  </tr>
                )}
                {!loading && subs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      No registrations yet. Complete the customer flow to see entries here.
                    </td>
                  </tr>
                )}
                {subs.map((s) => (
                  <Fragment key={s.registration_id}>
                    <tr
                      className="hover:bg-secondary/60"
                      onClick={() =>
                        setExpanded(expanded === s.registration_id ? null : s.registration_id)
                      }
                    >
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
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-[10px] border px-2.5 py-1 text-xs font-semibold transition",
                            expanded === s.registration_id
                              ? "border-[color:var(--olive)] bg-[color:var(--cream)] text-[color:var(--olive-deep)]"
                              : "border-input bg-background text-foreground hover:bg-secondary",
                          )}
                        >
                          {expanded === s.registration_id ? "Hide" : "View"}
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              expanded === s.registration_id && "rotate-180",
                            )}
                          />
                        </span>
                      </td>
                    </tr>
                    {expanded === s.registration_id && (
                      <tr>
                        <td colSpan={9} className="bg-background/60 px-4 py-4">
                          <RegistrationDetail row={s} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Expanded row: full bride & groom details ---------- */

function RegistrationDetail({ row }: { row: RegistrationRow }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Bride */}
      <div className="rounded-[14px] border border-border bg-card">
        <div className="border-b border-border bg-[color:var(--cream)]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--olive-deep)]">
          Bride Details
        </div>
        <dl className="divide-y divide-border text-sm">
          <DetailRow label="Name" value={row.bride_name} />
          <DetailRow label="Age" value={row.bride_age} />
          <DetailRow label="Contact" value={row.bride_contact} />
          <DetailRow label="Occupation" value={row.bride_occupation} />
          <DetailRow label="Village" value={row.bride_village} />
        </dl>
      </div>

      {/* Groom */}
      <div className="rounded-[14px] border border-border bg-card">
        <div className="border-b border-border bg-[color:var(--cream)]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--olive-deep)]">
          Groom Details
        </div>
        <dl className="divide-y divide-border text-sm">
          <DetailRow label="Name" value={row.groom_name} />
          <DetailRow label="Age" value={row.groom_age} />
          <DetailRow label="Contact" value={row.groom_contact} />
          <DetailRow label="Occupation" value={row.groom_occupation} />
          <DetailRow label="Village" value={row.groom_village} />
        </dl>
      </div>

      {/* Contact & location */}
      <div className="rounded-[14px] border border-border bg-card">
        <div className="border-b border-border bg-[color:var(--cream)]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--olive-deep)]">
          Contact & Location
        </div>
        <dl className="divide-y divide-border text-sm">
          <DetailRow label="Mobile" value={row.mobile} />
          <DetailRow label="WhatsApp" value={row.whatsapp} />
          <DetailRow label="State" value={row.state} />
          <DetailRow label="District" value={row.district} />
          <DetailRow label="City" value={row.city} />
        </dl>
      </div>

      {/* Registration info */}
      <div className="rounded-[14px] border border-border bg-card">
        <div className="border-b border-border bg-[color:var(--cream)]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--olive-deep)]">
          Registration
        </div>
        <dl className="divide-y divide-border text-sm">
          <DetailRow label="Reg ID" value={row.registration_id} mono />
          <DetailRow
            label="Submitted"
            value={row.created_at ? new Date(row.created_at).toLocaleString() : null}
          />
          <DetailRow label="Status" value={row.status || "new"} />
          <DetailRow
            label="Payment"
            value={row.payment_status === "paid" ? "Paid" : "Pending"}
          />
          <DetailRow label="Documents" value={`${row.uploaded_docs}/12`} />
        </dl>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)] items-start gap-3 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 font-medium text-foreground", mono && "font-mono text-xs")}>
        {value || "—"}
      </dd>
    </div>
  );
}
