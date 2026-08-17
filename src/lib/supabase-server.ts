/**
 * Server-only Supabase access for the Prince marriage portal.
 *
 * IMPORTANT SECURITY NOTES
 * ------------------------
 * - This module is executed on the server (Node / Cloudflare Worker / Nitro).
 *   `SUPABASE_SERVICE_ROLE_KEY` is read from `import.meta.env` here and MUST
 *   NEVER be used in client code (never prefix it with VITE_).
 * - Document uploads/downloads go through *signed* storage URLs so the raw
 *   service-role key never reaches the browser.
 * - Every table has RLS enabled and anon access blocked; the service role
 *   bypasses RLS, which is exactly what we rely on for server writes.
 */

import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  checkAdminCredentials,
  createAdminCookieValue,
  isAdminCookieValid,
  ADMIN_COOKIE,
} from "./admin-auth";

const BUCKET = "marriage-documents";

/* ---------------------------------------------------------------------------
 * Admin authentication
 * ------------------------------------------------------------------------- */

/**
 * Validate admin credentials and, on success, set a signed auth cookie. This
 * runs entirely on the server — the credentials never have to live in the
 * browser bundle.
 */
export const adminLogin = createServerFn()
  .validator((d: { username: string; password: string }) => d)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!checkAdminCredentials(data.username, data.password)) {
      return { ok: false };
    }
    setCookie(ADMIN_COOKIE, await createAdminCookieValue(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return { ok: true };
  });

/** Clear the admin auth cookie. */
export const adminLogout = createServerFn().handler(async (): Promise<{ ok: boolean }> => {
  deleteCookie(ADMIN_COOKIE, { path: "/" });
  return { ok: true };
});

/** Report whether the current request is authenticated (used by the login page). */
export const adminSession = createServerFn().handler(async (): Promise<{ authed: boolean }> => {
  return { authed: await isAdminCookieValid(getCookie(ADMIN_COOKIE)) };
});

export const DOC_KEYS = [
  "groom_aadhaar",
  "bride_aadhaar",
  "groom_tc",
  "bride_tc",
  "groom_ration",
  "bride_ration",
  "groom_photo",
  "bride_photo",
  "groom_father_aadhaar",
  "groom_mother_aadhaar",
  "bride_father_aadhaar",
  "bride_mother_aadhaar",
] as const;

export type DocKey = (typeof DOC_KEYS)[number];

/**
 * Server-only env access.
 * - `VITE_*` vars are injected into `import.meta.env` by Vite (Lovable config
 *   loads only `VITE_`-prefixed vars). `VITE_SUPABASE_URL` is read from there.
 * - `SUPABASE_SERVICE_ROLE_KEY` is NOT `VITE_`-prefixed on purpose, so it never
 *   reaches the client bundle. It is read from `process.env` instead, which is
 *   populated by both Vite's SSR dev server and Nitro (dotenv loads `.env`).
 */
function supabaseServer(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key =
    (typeof process !== "undefined"
      ? (process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined)
      : undefined) ??
    (import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined);
  if (!url || !key) {
    throw new Error(
      "Supabase server config missing. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/* ---------------------------------------------------------------------------
 * Types shared between client and server
 * ------------------------------------------------------------------------- */

export type CustomerInput = {
  registration_id: string;
  bride_name: string;
  groom_name: string;
  mobile: string;
  whatsapp: string;
  district: string;
  state: string;
  city: string;
  lang: string;
};

export type MarriageDetailsInput = {
  groom_age: string;
  bride_age: string;
  groom_contact: string;
  bride_contact: string;
  groom_occupation: string;
  bride_occupation: string;
  groom_village: string;
  bride_village: string;
};

export type PaymentInput = {
  status: "pending" | "paid" | "failed";
  method?: string;
  reference?: string;
};

/** One row for the admin dashboard list. */
export type RegistrationRow = {
  id: string;
  registration_id: string;
  bride_name: string | null;
  groom_name: string | null;
  district: string | null;
  payment_status: string | null;
  status: string | null;
  uploaded_docs: number;
  created_at: string | null;
};

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/**
 * Get the customer id for a registration_id, creating the row (plus the
 * 'new' workflow entry) the first time. Does NOT overwrite basic details —
 * callers that have basic-detail fields use upsertCustomer instead.
 */
async function ensureCustomer(
  sb: SupabaseClient,
  regId: string,
): Promise<string> {
  const existing = await sb
    .from("customers")
    .select("id")
    .eq("registration_id", regId)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id as string;

  const inserted = await sb
    .from("customers")
    .insert({ registration_id: regId })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  const customerId = inserted.data.id as string;

  // Seed the workflow record for a brand-new registration.
  await sb
    .from("registration_status")
    .insert({ customer_id: customerId, status: "new" });

  return customerId;
}

/** Upsert the full basic-details customer row (from Step 1 / finalize). */
async function upsertCustomer(sb: SupabaseClient, c: CustomerInput): Promise<string> {
  const customerId = await ensureCustomer(sb, c.registration_id);
  await sb
    .from("customers")
    .update(c)
    .eq("registration_id", c.registration_id);
  return customerId;
}

function storagePath(regId: string, docKey: string) {
  return `${regId}/${docKey}`;
}

/* ---------------------------------------------------------------------------
 * Server functions (called from the browser, executed on the server)
 * ------------------------------------------------------------------------- */

/** Auto-save Step 1 (basic details). Creates the customer row on first call. */
export const saveBasicDetails = createServerFn()
  .validator((d: CustomerInput) => d)
  .handler(async ({ data }) => {
    const sb = supabaseServer();
    await upsertCustomer(sb, data);
    return { ok: true };
  });

/** Auto-save Step 3 (marriage / personal details). */
export const saveMarriageDetails = createServerFn()
  .validator((d: { registration_id: string } & MarriageDetailsInput) => d)
  .handler(async ({ data }) => {
    const sb = supabaseServer();
    const { registration_id, ...rest } = data;
    const customerId = await ensureCustomer(sb, registration_id);

    const existing = await sb
      .from("marriage_details")
      .select("id")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (existing.data?.id) {
      await sb.from("marriage_details").update(rest).eq("customer_id", customerId);
    } else {
      await sb
        .from("marriage_details")
        .insert({ customer_id: customerId, ...rest });
    }
    return { ok: true };
  });

/** Record payment state. */
export const savePayment = createServerFn()
  .validator((d: { registration_id: string } & PaymentInput) => d)
  .handler(async ({ data }) => {
    const sb = supabaseServer();
    const { registration_id, ...payment } = data;
    const customerId = await ensureCustomer(sb, registration_id);

    const existing = await sb
      .from("payments")
      .select("id")
      .eq("customer_id", customerId)
      .maybeSingle();

    const row = {
      customer_id: customerId,
      status: payment.status,
      method: payment.method ?? "",
      reference: payment.reference ?? "",
      paid_at: payment.status === "paid" ? new Date().toISOString() : null,
    };

    if (existing.data?.id) {
      await sb.from("payments").update(row).eq("customer_id", customerId);
    } else {
      await sb.from("payments").insert(row);
    }
    return { ok: true };
  });

/* ---------------------------------------------------------------------------
 * Razorpay
 * ------------------------------------------------------------------------- */

export type CreatePaymentOrderInput = {
  registration_id: string;
  amount: number; // rupees
};

export type CreatePaymentOrderResult =
  | { ok: true; order_id: string; amount_paise: number; key_id: string }
  | { ok: false; error: string };

/**
 * Create a Razorpay order for a registration so the client can run the
 * checkout. Secrets are read server-side only — `RAZORPAY_KEY_ID` and
 * `RAZORPAY_KEY_SECRET` must be set in the deployment environment. When they
 * are missing (e.g. local dev), the server returns `{ ok: false }` so the UI
 * can fall back gracefully instead of crashing.
 */
export const createPaymentOrder = createServerFn()
  .validator((d: CreatePaymentOrderInput) => d)
  .handler(async ({ data }): Promise<CreatePaymentOrderResult> => {
    const keyId =
      (typeof process !== "undefined" ? process.env.RAZORPAY_KEY_ID : undefined) ??
      (import.meta.env.RAZORPAY_KEY_ID as string | undefined);
    const keySecret =
      (typeof process !== "undefined" ? process.env.RAZORPAY_KEY_SECRET : undefined) ??
      (import.meta.env.RAZORPAY_KEY_SECRET as string | undefined);

    if (!keyId || !keySecret) {
      return {
        ok: false,
        error: "Razorpay is not configured yet. Please pay by UPI or contact support.",
      };
    }

    const amountPaise = Math.round(data.amount * 100);
    const auth = btoa(`${keyId}:${keySecret}`);
    let res: Response;
    try {
      res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `reg_${data.registration_id}`,
          notes: { registration_id: data.registration_id },
        }),
      });
    } catch (err) {
      return { ok: false, error: "Could not reach Razorpay. Please try again." };
    }

    if (!res.ok) {
      let detail = "";
      try {
        detail = JSON.stringify(await res.json());
      } catch {}
      return {
        ok: false,
        error: `Razorpay order failed (${res.status}). ${detail}`.trim(),
      };
    }

    const order = (await res.json()) as { id: string; amount: number };
    return { ok: true, order_id: order.id, amount_paise: order.amount, key_id: keyId };
  });

/**
 * Mint a signed upload URL for one document. The client PUTs the file bytes
 * directly to this URL (signed, 10-minute TTL), so large files never pass
 * through the serverless function.
 */
export const getDocumentUploadUrl = createServerFn()
  .validator(
    (d: {
      registration_id: string;
      doc_key: DocKey;
      content_type: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const sb = supabaseServer();
    const { data: signed } = await sb.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath(data.registration_id, data.doc_key), {
        upsert: true,
      });

    if (!signed?.token) {
      throw new Error(
        "Unable to create a signed upload URL. Run supabase/schema.sql first.",
      );
    }

    return {
      uploadUrl: signed.signedUrl,
      storagePath: storagePath(data.registration_id, data.doc_key),
    };
  });

/** Record a document row after the client finished the upload. */
export const saveDocument = createServerFn()
  .validator(
    (d: {
      registration_id: string;
      doc_key: DocKey;
      file_name: string;
      size: number;
      mime_type: string;
      storage_path: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const sb = supabaseServer();
    const { registration_id, ...doc } = data;
    const customerId = await ensureCustomer(sb, registration_id);

    const existing = await sb
      .from("documents")
      .select("id")
      .eq("customer_id", customerId)
      .eq("doc_key", doc.doc_key)
      .maybeSingle();

    if (existing.data?.id) {
      await sb.from("documents").update(doc).eq("customer_id", customerId).eq("doc_key", doc.doc_key);
    } else {
      await sb.from("documents").insert({ customer_id: customerId, ...doc });
    }

    // If every required doc is now uploaded, advance the workflow.
    const { count } = await sb
      .from("documents")
      .select("doc_key", { count: "exact", head: true })
      .eq("customer_id", customerId);

    if ((count ?? 0) >= DOC_KEYS.length) {
      const { data: cur } = await sb
        .from("registration_status")
        .select("status")
        .eq("customer_id", customerId)
        .order("changed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const status = (cur?.status ?? "new") as string;
      if (status === "new" || status === "payment_completed") {
        await sb.from("registration_status").insert({
          customer_id: customerId,
          status: "documents_uploaded",
        });
      }
    }

    return { ok: true };
  });

/** Final submission: confirm payment, advance workflow, queue notifications. */
export const finalizeRegistration = createServerFn()
  .validator(
    (d: {
      registration_id: string;
      bride_name: string;
      groom_name: string;
      mobile: string;
      whatsapp: string;
      district: string;
      state: string;
      city: string;
      payment_status: "pending" | "paid" | "failed";
      payment_ref?: string;
      lang: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const sb = supabaseServer();
    const { registration_id, payment_status, payment_ref, lang, ...customer } = data;
    const customerId = await upsertCustomer(sb, {
      registration_id,
      ...customer,
      lang,
    });

    // Ensure payment row reflects final state.
    const existingPay = await sb
      .from("payments")
      .select("id")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (existingPay.data?.id) {
      await sb.from("payments").update({
        status: payment_status,
        reference: payment_ref ?? "",
        paid_at: payment_status === "paid" ? new Date().toISOString() : null,
      }).eq("customer_id", customerId);
    } else {
      await sb.from("payments").insert({
        customer_id: customerId,
        status: payment_status,
        reference: payment_ref ?? "",
        paid_at: payment_status === "paid" ? new Date().toISOString() : null,
      });
    }

    // Workflow: new -> payment_completed (documents will move it further).
    await sb.from("registration_status").insert({
      customer_id: customerId,
      status: "payment_completed",
      note: "Final submission by customer",
    });

    // WhatsApp automation placeholders (wire to an actual provider later).
    await sb.from("notifications").insert([
      {
        customer_id: customerId,
        type: "admin",
        channel: "whatsapp",
        payload: {
          text: `New Marriage Registration\nBride: ${data.bride_name}\nGroom: ${data.groom_name}\nDistrict: ${data.district}\nPayment: ${payment_status}\nRegistration ID: ${registration_id}`,
        },
      },
      {
        customer_id: customerId,
        type: "customer",
        channel: "whatsapp",
        payload: {
          text: `Thank you for registering with Prince Group.\nYour Registration ID: ${registration_id}\nOur executive will contact you soon.`,
        },
      },
    ]);

    return { ok: true, registration_id };
  });

/** Admin dashboard list. */
export const listRegistrations = createServerFn()
  .handler(async () => {
    const sb = supabaseServer();

    const { data: customers } = await sb
      .from("customers")
      .select(
        "id, registration_id, bride_name, groom_name, district, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    const rows = customers ?? [];

    const ids = rows.map((r) => (r as { id: string }).id);

    let payments: { customer_id: string; status: string }[] = [];
    let statuses: { customer_id: string; status: string }[] = [];
    let docs: { customer_id: string; id: string }[] = [];

    if (ids.length) {
      const results = await Promise.all([
        sb.from("payments").select("customer_id, status").in("customer_id", ids),
        sb.from("registration_status")
          .select("customer_id, status")
          .order("changed_at", { ascending: false })
          .in("customer_id", ids),
        sb.from("documents").select("customer_id, id").in("customer_id", ids),
      ]);
      payments = (results[0].data ?? []) as { customer_id: string; status: string }[];
      statuses = (results[1].data ?? []) as { customer_id: string; status: string }[];
      docs = (results[2].data ?? []) as { customer_id: string; id: string }[];
    }

    const payMap = new Map(payments.map((p) => [p.customer_id, p.status]));
    const statusMap = new Map<string, string>();
    for (const s of statuses) {
      if (!statusMap.has(s.customer_id)) {
        statusMap.set(s.customer_id, s.status);
      }
    }
    const docCountMap = new Map<string, number>();
    for (const d of docs) {
      docCountMap.set(d.customer_id, (docCountMap.get(d.customer_id) ?? 0) + 1);
    }

    const list: RegistrationRow[] = rows.map((r) => {
      const c = r as {
        id: string;
        registration_id: string;
        bride_name: string | null;
        groom_name: string | null;
        district: string | null;
        created_at: string | null;
      };
      return {
        id: c.id,
        registration_id: c.registration_id,
        bride_name: c.bride_name,
        groom_name: c.groom_name,
        district: c.district,
        payment_status: payMap.get(c.id) ?? null,
        status: statusMap.get(c.id) ?? "new",
        uploaded_docs: docCountMap.get(c.id) ?? 0,
        created_at: c.created_at,
      };
    });

    return list;
  });

/** Signed URL to read a stored document (admin downloads, later). */
export const getDocumentDownloadUrl = createServerFn()
  .validator((d: { registration_id: string; doc_key: DocKey }) => d)
  .handler(async ({ data }) => {
    const sb = supabaseServer();
    const { data: signed } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(storagePath(data.registration_id, data.doc_key), 300);

    if (!signed?.signedUrl) {
      throw new Error("Signed URL could not be created.");
    }
    return { downloadUrl: signed.signedUrl };
  });
