import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, Download, Home, PartyPopper } from "lucide-react";


const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/success")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Registration Submitted — Prince Group" },
      {
        name: "description",
        content: "Your marriage registration has been submitted successfully.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useSearch();

  function downloadAck() {
    const content = `PRINCE GROUP OF COMPANIES
Marriage Registration Acknowledgement
--------------------------------------
Registration ID: ${id || "PG-XXXX"}
Submitted: ${new Date().toLocaleString()}

Thank you for choosing Prince Group. Our executive will
verify your documents and contact you shortly on WhatsApp.
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PrinceGroup-Acknowledgement-${id || "receipt"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="card-premium relative overflow-hidden p-8 text-center sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0 opacity-40"
            style={{
              background:
                "radial-gradient(500px 200px at 50% -20%, rgba(200,169,81,0.4), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[color:var(--olive)]/10 text-primary shadow-inner">
              <CheckCircle2 className="h-11 w-11 animate-in zoom-in-50 duration-500" />
            </div>
            <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--gold)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--gold-foreground)]">
              <PartyPopper className="h-3.5 w-3.5" /> Success
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold text-foreground sm:text-4xl">
              Registration Submitted Successfully
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Thank you for choosing Prince Group. Our executive will verify your
              documents and contact you shortly.
            </p>

            {id && (
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-[12px] border border-border bg-[color:var(--cream)] px-4 py-2 text-sm">
                <span className="text-muted-foreground">Registration ID:</span>
                <span className="font-mono font-semibold text-foreground">{id}</span>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={downloadAck}
                className="inline-flex items-center gap-2 rounded-[14px] gradient-olive px-5 py-3 text-sm font-semibold text-[color:var(--cream)] shadow-md transition hover:opacity-95"
              >
                <Download className="h-4 w-4" /> Download Acknowledgement
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-[14px] border border-input bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                <Home className="h-4 w-4" /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
