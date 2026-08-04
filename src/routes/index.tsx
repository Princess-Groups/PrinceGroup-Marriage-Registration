import { createFileRoute, useNavigate } from "@tanstack/react-router";
import princeUpiQr from "@/assets/prince-upi-qr.jpeg.asset.json";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  IndianRupee,
  Loader2,
  QrCode,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  finalizeRegistration,
  getDocumentUploadUrl,
  saveBasicDetails,
  saveDocument,
  saveMarriageDetails,
  savePayment,
} from "@/lib/supabase-server";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marriage Registration Form — Prince Group" },
      {
        name: "description",
        content:
          "Register your marriage online with Prince Group. Simple, secure and guided marriage registration form.",
      },
      { property: "og:title", content: "Marriage Registration Form — Prince Group" },
      {
        property: "og:description",
        content: "Complete your marriage registration online with Prince Group.",
      },
    ],
  }),
  component: PortalPage,
});

/* ---------- i18n ---------- */

type Lang = "en" | "ta" | "ml";

const T = {
  en: {
    formTitle: "Marriage Registration Form",
    basicDesc: "Please provide the basic details of the bride and groom.",
    bride: "Bride Name",
    groom: "Groom Name",
    mobile: "Mobile Number",
    whatsapp: "WhatsApp Number",
    sameNum: "Mobile Number is the same as WhatsApp Number",
    district: "District",
    state: "State",
    city: "Location / City",
    continue: "Continue",
    back: "Back",
    fee: "Marriage Registration Fee",
    payDesc: "Pay securely to continue with your registration.",
    payNow: "Pay ₹99",
    paid: "Payment Successful",
    processing: "Processing…",
    scanUpi: "Scan UPI QR",
    detailsTitle: "Personal Details & Document Upload",
    detailsDesc:
      "Please provide personal details and upload the required documents. All fields are mandatory.",
    review: "Review & Submit",
    reviewDesc: "Please review your details carefully before final submission.",
    confirm: "I confirm all information provided is correct and complete.",
    submit: "Submit Application",
    langTitle: "Select Your Language",
    langDesc: "Choose your preferred language to continue.",
  },
  ta: {
    formTitle: "திருமண பதிவு படிவம்",
    basicDesc: "மணமகன் மற்றும் மணமகளின் அடிப்படை விவரங்களை வழங்கவும்.",
    bride: "மணமகள் பெயர்",
    groom: "மணமகன் பெயர்",
    mobile: "மொபைல் எண்",
    whatsapp: "வாட்ஸ்அப் எண்",
    sameNum: "மொபைல் எண்ணும் வாட்ஸ்அப் எண்ணும் ஒன்றே",
    district: "மாவட்டம்",
    state: "மாநிலம்",
    city: "இடம் / நகரம்",
    continue: "தொடரவும்",
    back: "பின்",
    fee: "திருமண பதிவு கட்டணம்",
    payDesc: "தொடர்வதற்கு பாதுகாப்பாக செலுத்தவும்.",
    payNow: "₹99 செலுத்தவும்",
    paid: "பணம் வெற்றிகரமாக செலுத்தப்பட்டது",
    processing: "செயலாக்கம்…",
    scanUpi: "UPI QR ஸ்கேன் செய்யவும்",
    detailsTitle: "தனிப்பட்ட விவரங்கள் & ஆவணங்கள் பதிவேற்றம்",
    detailsDesc:
      "தனிப்பட்ட விவரங்களை வழங்கி தேவையான ஆவணங்களை பதிவேற்றவும். அனைத்து புலங்களும் கட்டாயம்.",
    review: "மீளாய்வு & சமர்ப்பிக்கவும்",
    reviewDesc: "இறுதி சமர்ப்பிப்பதற்கு முன் விவரங்களை கவனமாக பார்க்கவும்.",
    confirm: "வழங்கப்பட்ட அனைத்து தகவல்களும் சரியானது என உறுதி செய்கிறேன்.",
    submit: "விண்ணப்பம் சமர்ப்பிக்கவும்",
    langTitle: "உங்கள் மொழியை தேர்ந்தெடுக்கவும்",
    langDesc: "தொடர விருப்பமான மொழியை தேர்ந்தெடுக்கவும்.",
  },
  ml: {
    formTitle: "വിവാഹ രജിസ്ട്രേഷൻ ഫോം",
    basicDesc: "വധുവിന്റെയും വരന്റെയും അടിസ്ഥാന വിവരങ്ങൾ നൽകുക.",
    bride: "വധുവിന്റെ പേര്",
    groom: "വരന്റെ പേര്",
    mobile: "മൊബൈൽ നമ്പർ",
    whatsapp: "വാട്ട്‌സ്ആപ്പ് നമ്പർ",
    sameNum: "മൊബൈൽ നമ്പറും വാട്ട്‌സ്ആപ്പ് നമ്പറും ഒന്നാണ്",
    district: "ജില്ല",
    state: "സംസ്ഥാനം",
    city: "സ്ഥലം / നഗരം",
    continue: "തുടരുക",
    back: "പിന്നോട്ട്",
    fee: "വിവാഹ രജിസ്ട്രേഷൻ ഫീസ്",
    payDesc: "തുടരാൻ സുരക്ഷിതമായി പണം അടയ്ക്കുക.",
    payNow: "₹99 അടയ്ക്കുക",
    paid: "പേയ്‌മെന്റ് വിജയകരം",
    processing: "പ്രോസസ്സിംഗ്…",
    scanUpi: "UPI QR സ്കാൻ ചെയ്യുക",
    detailsTitle: "വ്യക്തിഗത വിവരങ്ങൾ & രേഖകൾ അപ്‌ലോഡ്",
    detailsDesc:
      "വ്യക്തിഗത വിവരങ്ങൾ നൽകി ആവശ്യമായ രേഖകൾ അപ്‌ലോഡ് ചെയ്യുക. എല്ലാ ഫീൽഡുകളും നിർബന്ധമാണ്.",
    review: "അവലോകനം & സമർപ്പിക്കുക",
    reviewDesc: "അന്തിമ സമർപ്പണത്തിന് മുമ്പ് വിവരങ്ങൾ ശ്രദ്ധയോടെ പരിശോധിക്കുക.",
    confirm: "നൽകിയ എല്ലാ വിവരങ്ങളും ശരിയാണെന്ന് ഞാൻ സ്ഥിരീകരിക്കുന്നു.",
    submit: "അപേക്ഷ സമർപ്പിക്കുക",
    langTitle: "നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക",
    langDesc: "തുടരാൻ ഇഷ്ടപ്പെട്ട ഭാഷ തിരഞ്ഞെടുക്കുക.",
  },
} as const;

/* ---------- Types ---------- */

type UploadedFile = {
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // preview for images only
  /** true only once the file has been persisted to Supabase Storage. */
  uploaded?: boolean;
};

type Person = {
  age: string;
  contact: string;
  occupation: string;
  village: string;
};

type FormState = {
  regId: string;
  brideName: string;
  groomName: string;
  mobile: string;
  whatsapp: string;
  sameNumber: boolean;
  district: string;
  state: string;
  city: string;
  paymentStatus: "pending" | "paid";
  paymentRef?: string;
  bride: Person;
  groom: Person;
  documents: Record<string, UploadedFile | null>;
  confirmed: boolean;
};

const emptyPerson: Person = { age: "", contact: "", occupation: "", village: "" };

/** Ordered list of upload fields (mandatory). Order matches the request. */
const UPLOAD_FIELDS: { key: string; label: string }[] = [
  { key: "groom_aadhaar", label: "Groom Aadhaar Card Copy" },
  { key: "bride_aadhaar", label: "Bride Aadhaar Card Copy" },
  { key: "groom_tc", label: "Groom Transfer Certificate (TC)" },
  { key: "bride_tc", label: "Bride Transfer Certificate (TC)" },
  { key: "groom_ration", label: "Groom Ration Card" },
  { key: "bride_ration", label: "Bride Ration Card" },
  { key: "groom_photo", label: "Groom Passport Size Photo" },
  { key: "bride_photo", label: "Bride Passport Size Photo" },
  { key: "groom_father_aadhaar", label: "Groom Father Aadhaar Card" },
  { key: "groom_mother_aadhaar", label: "Groom Mother Aadhaar Card" },
  { key: "bride_father_aadhaar", label: "Bride Father Aadhaar Card" },
  { key: "bride_mother_aadhaar", label: "Bride Mother Aadhaar Card" },
];

const DISTRICTS = [
  "Kanyakumari","Tirunelveli","Thoothukudi","Madurai","Chennai","Coimbatore","Salem",
  "Tiruchirappalli","Erode","Vellore","Thanjavur","Dindigul","Virudhunagar",
  "Ramanathapuram","Sivaganga","Nagercoil","Marthandam","Colachel","Thuckalay",
  "Kuzhithurai","Padmanabhapuram","Thiruvananthapuram","Kollam","Ernakulam",
  "Kozhikode","Bengaluru Urban","Mysuru",
];

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh",
  "Lakshadweep","Puducherry",
];

const STORAGE_KEY = "pg_marriage_reg_v3";
const LANG_KEY = "pg_lang_v1";
const PHASE_KEY = "pg_phase_v2";

const MAX_FILE_MB = 10;
const ACCEPTED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];
const ACCEPT_ATTR = "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.pdf";

function isAcceptedFile(f: File) {
  const name = f.name.toLowerCase();
  if (ACCEPTED_EXT.some((ext) => name.endsWith(ext))) return true;
  const t = f.type;
  return (
    t === "application/pdf" ||
    t === "image/jpeg" ||
    t === "image/png" ||
    t === "image/webp" ||
    t === "image/heic" ||
    t === "image/heif"
  );
}

function newRegId() {
  const y = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `PG-${y}-${rand}`;
}

/** Upload a raw file to Supabase Storage via a server-minted signed URL. */
async function uploadFileViaSignedUrl(file: File, regId: string, docKey: string) {
  const signed = await getDocumentUploadUrl({
    data: {
      registration_id: regId,
      doc_key: docKey as "groom_aadhaar",
      content_type: file.type || "application/octet-stream",
    },
  });
  const res = await fetch(signed.uploadUrl, { method: "PUT", body: file });
  if (!res.ok) {
    throw new Error(`Upload failed (HTTP ${res.status})`);
  }
  await saveDocument({
    data: {
      registration_id: regId,
      doc_key: docKey as "groom_aadhaar",
      file_name: file.name,
      size: file.size,
      mime_type: file.type || "application/octet-stream",
      storage_path: signed.storagePath,
    },
  });
}

function initialState(): FormState {
  return {
    regId: newRegId(),
    brideName: "",
    groomName: "",
    mobile: "",
    whatsapp: "",
    sameNumber: false,
    district: "",
    state: "Tamil Nadu",
    city: "",
    paymentStatus: "pending",
    bride: { ...emptyPerson },
    groom: { ...emptyPerson },
    documents: Object.fromEntries(UPLOAD_FIELDS.map((d) => [d.key, null])),
    confirmed: false,
  };
}

/* ---------- Page shell ---------- */

type Phase = "lang" | "basic" | "payment" | "details" | "review";

function PortalPage() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState<Lang | null>(null);
  const [phase, setPhase] = useState<Phase>("lang");
  const [data, setData] = useState<FormState>(() => initialState());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
      if (savedLang) setLang(savedLang);
      const savedPhase = localStorage.getItem(PHASE_KEY) as Phase | null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...initialState(), ...JSON.parse(raw) });
      if (savedLang && savedPhase && savedPhase !== "lang") setPhase(savedPhase);
      else if (savedLang) setPhase("basic");
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      // Persist everything except heavy file dataUrls
      const stripped: FormState = {
        ...data,
        documents: Object.fromEntries(
          Object.entries(data.documents).map(([k, v]) => [
            k,
            v ? { name: v.name, size: v.size, type: v.type } : null,
          ]),
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
      localStorage.setItem(PHASE_KEY, phase);
      if (lang) localStorage.setItem(LANG_KEY, lang);
    } catch {}
  }, [data, phase, lang, hydrated]);

  const t = T[lang ?? "en"];

  function goTo(p: Phase) {
    // Auto-save completed steps to Supabase as the user advances.
    if (p !== "lang" && hydrated) {
      if (p === "payment" || p === "details" || p === "review") {
        // Step 1 (basic details) is complete by now.
        saveBasicDetails({
          data: {
            registration_id: data.regId,
            bride_name: data.brideName,
            groom_name: data.groomName,
            mobile: data.mobile,
            whatsapp: data.sameNumber ? data.mobile : data.whatsapp,
            district: data.district,
            state: data.state,
            city: data.city,
            lang: lang ?? "en",
          },
        }).catch(() =>
          toast.error("Couldn't save basic details to the server. You'll be retried on submit."),
        );
      }
      if (p === "details" || p === "review") {
        // Step 2 (payment) was completed to reach this point.
        savePayment({
          data: {
            registration_id: data.regId,
            status: data.paymentStatus,
            method: data.paymentRef ? "UPI" : undefined,
            reference: data.paymentRef,
          },
        }).catch(() => {});
        // Step 3 (personal details).
        saveMarriageDetails({
          data: {
            registration_id: data.regId,
            groom_age: data.groom.age,
            bride_age: data.bride.age,
            groom_contact: data.groom.contact,
            bride_contact: data.bride.contact,
            groom_occupation: data.groom.occupation,
            bride_occupation: data.bride.occupation,
            groom_village: data.groom.village,
            bride_village: data.bride.village,
          },
        }).catch(() => {});
      }
    }
    setPhase(p);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitAll() {
    if (!data.confirmed) {
      toast.error("Please confirm your information before submitting.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await finalizeRegistration({
        data: {
          registration_id: data.regId,
          bride_name: data.brideName,
          groom_name: data.groomName,
          district: data.district,
          mobile: data.mobile,
          whatsapp: data.sameNumber ? data.mobile : data.whatsapp,
          state: data.state,
          city: data.city,
          payment_status: data.paymentStatus,
          payment_ref: data.paymentRef,
          lang: lang ?? "en",
        },
      });
      // Keep the draft until confirmation, then clear it.
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PHASE_KEY);
      navigate({ to: "/success", search: { id: data.regId } });
    } catch (err) {
      console.error("[supabase] finalize failed", err);
      toast.error(
        "Submission failed. Your details are saved on this device — please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[color:var(--olive)]/25 bg-[color:var(--cream)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--olive-deep)]">
            Prince Group of Companies
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            {phase === "lang" ? "Prince Group" : t.formTitle}
          </h1>
        </div>

        {phase === "lang" && (
          <LanguageSelect
            onSelect={(l) => {
              setLang(l);
              goTo("basic");
            }}
          />
        )}

        {phase === "basic" && lang && (
          <BasicForm t={t} data={data} onChange={setData} onNext={() => goTo("payment")} />
        )}

        {phase === "payment" && lang && (
          <PaymentPage
            t={t}
            data={data}
            onChange={setData}
            onBack={() => goTo("basic")}
            onPaid={() => goTo("details")}
          />
        )}

        {phase === "details" && lang && (
          <DetailsForm
            t={t}
            data={data}
            onChange={setData}
            onBack={() => goTo("payment")}
            onNext={() => goTo("review")}
          />
        )}

        {phase === "review" && lang && (
          <ReviewPage
            t={t}
            data={data}
            onChange={setData}
            onBack={() => goTo("details")}
            onSubmit={submitAll}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Language ---------- */

function LanguageSelect({ onSelect }: { onSelect: (l: Lang) => void }) {
  const languages: { code: Lang; native: string; english: string }[] = [
    { code: "en", native: "English", english: "English" },
    { code: "ta", native: "தமிழ்", english: "Tamil" },
    { code: "ml", native: "മലയാളം", english: "Malayalam" },
  ];
  return (
    <div className="card-premium p-6 sm:p-10">
      <div className="text-center">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Select Your Language
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your preferred language to continue.
        </p>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => onSelect(l.code)}
            className="group flex flex-col items-center gap-1 rounded-[14px] border border-border bg-background p-6 text-center transition hover:border-[color:var(--olive)] hover:bg-[color:var(--cream)] hover:shadow-md"
          >
            <span className="font-display text-2xl font-semibold text-foreground group-hover:text-primary">
              {l.native}
            </span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {l.english}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Card shell ---------- */

function Card({
  desc,
  children,
  footer,
}: {
  desc?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="card-premium overflow-hidden">
      {desc && (
        <div className="border-b border-border bg-[color:var(--cream)]/60 px-5 py-4 sm:px-6">
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/60 p-4 sm:p-5">
        {footer}
      </div>
    </div>
  );
}

/* ---------- Basic form ---------- */

function BasicForm({
  t,
  data,
  onChange,
  onNext,
}: {
  t: (typeof T)[Lang];
  data: FormState;
  onChange: (d: FormState) => void;
  onNext: () => void;
}) {
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!data.brideName.trim()) errs.push(t.bride);
    if (!data.groomName.trim()) errs.push(t.groom);
    if (!/^\d{10}$/.test(data.mobile)) errs.push(t.mobile);
    if (!data.sameNumber && !/^\d{10}$/.test(data.whatsapp)) errs.push(t.whatsapp);
    if (!data.district.trim()) errs.push(t.district);
    if (!data.state.trim()) errs.push(t.state);
    if (!data.city.trim()) errs.push(t.city);
    if (errs.length) {
      toast.error(errs.join(", "));
      return;
    }
    onNext();
  }
  return (
    <form onSubmit={submit}>
      <Card
        desc={t.basicDesc}
        footer={
          <>
            <div />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-[14px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-[color:var(--olive-deep)]"
            >
              {t.continue} <ArrowRight className="h-4 w-4" />
            </button>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.bride} required>
            <Input value={data.brideName} onChange={(e) => onChange({ ...data, brideName: e.target.value })} />
          </Field>
          <Field label={t.groom} required>
            <Input value={data.groomName} onChange={(e) => onChange({ ...data, groomName: e.target.value })} />
          </Field>
          <Field label={t.mobile} required>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={data.mobile}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                onChange({ ...data, mobile: v, whatsapp: data.sameNumber ? v : data.whatsapp });
              }}
              placeholder="10-digit"
            />
          </Field>
          <Field label={t.whatsapp} required>
            <Input
              inputMode="numeric"
              maxLength={10}
              disabled={data.sameNumber}
              value={data.sameNumber ? data.mobile : data.whatsapp}
              onChange={(e) => onChange({ ...data, whatsapp: e.target.value.replace(/\D/g, "") })}
              placeholder="10-digit"
            />
          </Field>
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={data.sameNumber}
                onCheckedChange={(v) =>
                  onChange({ ...data, sameNumber: !!v, whatsapp: v ? data.mobile : data.whatsapp })
                }
              />
              {t.sameNum}
            </label>
          </div>
          <Field label={t.district} required>
            <SearchableInput
              value={data.district}
              onChange={(v) => onChange({ ...data, district: v })}
              suggestions={DISTRICTS}
              placeholder="Type your district"
            />
          </Field>
          <Field label={t.state} required>
            <SearchableInput
              value={data.state}
              onChange={(v) => onChange({ ...data, state: v })}
              suggestions={STATES}
              placeholder="Type your state"
            />
          </Field>
          <Field label={t.city} required>
            <Input value={data.city} onChange={(e) => onChange({ ...data, city: e.target.value })} />
          </Field>
        </div>
      </Card>
    </form>
  );
}

/* ---------- Payment ---------- */

function PaymentPage({
  t,
  data,
  onChange,
  onBack,
  onPaid,
}: {
  t: (typeof T)[Lang];
  data: FormState;
  onChange: (d: FormState) => void;
  onBack: () => void;
  onPaid: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const paid = data.paymentStatus === "paid";

  const UPI_ID = "9489359755@okbizaxis";
  const MERCHANT_NAME = "Prince Group Of Company";
  const AMOUNT = "99.00";

  // --- UPI helpers (NPCI spec) -------------------------------------------
  // tr / tid must be unique per attempt and strictly alphanumeric (<=35 chars).
  const alnum = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  function newTxnRef() {
    const base = alnum(data.regId || "PGMRP").slice(0, 12) || "PGMRP";
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${base}${stamp}${alnum(rand)}`.slice(0, 35);
  }

  function buildUpiUri(tr: string, tid: string) {
    // Only NPCI-standard params. Note: `mam`/`mc`/`mode`/`orgid` are merchant-
    // only fields — sending them from a P2P VPA makes GPay reject the txn
    // ("exceeded the bank limit"), so they are deliberately omitted.
    const params: Array<[string, string]> = [
      ["pa", UPI_ID],
      ["pn", MERCHANT_NAME],
      ["am", AMOUNT],
      ["cu", "INR"],
      ["tr", tr],
      ["tid", tid],
      ["tn", "Marriage Registration Fee"],
    ];
    // Manual encoding: URLSearchParams turns spaces into "+", which some UPI
    // apps do not decode. %20 is required.
    const qs = params
      .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "%20")}`)
      .join("&");
    return `upi://pay?${qs}`;
  }

  function validateUpiUri(uri: string) {
    const errors: string[] = [];
    const q = uri.split("?")[1] ?? "";
    const p = new URLSearchParams(q);
    if (!/^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(p.get("pa") ?? "")) errors.push("invalid pa");
    if (!(p.get("pn") ?? "").trim()) errors.push("missing pn");
    if (!/^\d+\.\d{2}$/.test(p.get("am") ?? "")) errors.push("invalid am");
    if (p.get("cu") !== "INR") errors.push("invalid cu");
    if (!/^[A-Za-z0-9]{1,35}$/.test(p.get("tr") ?? "")) errors.push("invalid tr");
    if (!/^[A-Za-z0-9]{1,35}$/.test(p.get("tid") ?? "")) errors.push("invalid tid");
    if (!(p.get("tn") ?? "").trim()) errors.push("missing tn");
    return errors;
  }

  const qrImage = princeUpiQr.url;


  // Auto-redirect once payment status flips to "paid" (covers both interactive
  // and manual verification paths).
  useEffect(() => {
    if (paid) {
      const id = window.setTimeout(onPaid, 600);
      return () => window.clearTimeout(id);
    }
  }, [paid, onPaid]);

  function markPaid(method: string, tr: string) {
    console.info("[UPI] response: SUCCESS (returned from app)", { method, tr });
    onChange({ ...data, paymentStatus: "paid", paymentRef: tr });
    setProcessing(false);
    toast.success(`${t.paid} · ${method}`);
  }

  // Guards against duplicate/rapid-fire launches creating parallel requests.
  const inFlight = useRef(false);
  const usedRefs = useRef<Set<string>>(new Set());

  function launchUpi(appScheme?: string, label = "UPI") {
    if (paid || processing || inFlight.current) return;

    let tr = newTxnRef();
    while (usedRefs.current.has(tr)) tr = newTxnRef();
    usedRefs.current.add(tr);
    const tid = `T${tr}`.slice(0, 35);

    const uri = buildUpiUri(tr, tid);
    const errors = validateUpiUri(uri);
    if (errors.length) {
      console.error("[UPI] invalid payment link", { uri, errors });
      toast.error("Payment link could not be generated. Please scan the QR code.");
      return;
    }

    console.info("[UPI] request", { app: label, tr, tid, amount: AMOUNT, pa: UPI_ID, uri });

    inFlight.current = true;
    setProcessing(true);

    const link = appScheme ? appScheme + uri.slice("upi:".length) : uri;
    const start = Date.now();
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      inFlight.current = false;
    };

    // No UPI app handled the intent → treat as FAILURE to launch.
    const timer = window.setTimeout(() => {
      if (settled) return;
      if (Date.now() - start >= 1800 && document.visibilityState === "visible") {
        settled = true;
        cleanup();
        setProcessing(false);
        console.warn("[UPI] response: FAILED — no UPI app handled the intent", { tr });
        toast.message("No UPI app detected. Please scan the QR code to pay.");
      }
    }, 2000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        // App opened. Wait for the user to come back and decide success/cancel.
        window.clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVisibility);
        const leftAt = Date.now();
        const onReturn = () => {
          if (document.visibilityState !== "visible" || settled) return;
          document.removeEventListener("visibilitychange", onReturn);
          settled = true;
          inFlight.current = false;
          const elapsed = Date.now() - leftAt;
          if (elapsed < 4000) {
            // Back almost immediately → user cancelled / dismissed the app.
            setProcessing(false);
            console.warn("[UPI] response: CANCELLED by user", { tr, elapsed });
            toast.message("Payment cancelled. You can retry or scan the QR code.");
          } else {
            markPaid(label, tr);
          }
        };
        document.addEventListener("visibilitychange", onReturn);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    try {
      window.location.href = link;
    } catch (err) {
      settled = true;
      cleanup();
      setProcessing(false);
      console.error("[UPI] response: FAILED to open app", { tr, err });
      toast.error("Unable to open UPI app.");
    }
  }


  return (
    <Card
      desc={t.payDesc}
      footer={
        <>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-[14px] border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </button>
          {paid ? (
            <button
              onClick={onPaid}
              className="inline-flex items-center gap-2 rounded-[14px] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-[color:var(--olive-deep)]"
            >
              {t.continue} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => markPaid("Manual", newTxnRef())}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              I've already paid
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--olive-deep)]">
            {t.fee}
          </div>
          <div className="mt-2 flex items-baseline justify-center gap-1 font-display text-5xl font-semibold text-primary">
            <IndianRupee className="h-8 w-8" />
            99
          </div>
        </div>

        <button
          type="button"
          onClick={() => launchUpi(undefined, "UPI")}
          disabled={paid || processing}
          className="inline-flex h-14 items-center gap-2 rounded-[14px] bg-primary px-10 text-lg font-semibold text-primary-foreground shadow-sm transition hover:bg-[color:var(--olive-deep)] disabled:opacity-60"
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <QrCode className="h-5 w-5" />
          )}
          {t.payNow}
        </button>

        {!paid && (
          <button
            type="button"
            onClick={() => launchUpi(undefined, "UPI")}
            className="h-36 w-36 rounded-[14px] border border-border bg-white p-2 transition hover:border-[color:var(--olive)] hover:shadow-md"
            aria-label="Pay via UPI QR code"
          >
            <img
              src={qrImage}
              alt="UPI QR code"
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </button>
        )}
      </div>
    </Card>
  );
}

/* ---------- Combined Details & Documents ---------- */

/** Ordered set of text-field pairs (groom then bride) that appear before uploads. */
const TEXT_PAIRS: {
  key: "contact" | "occupation" | "village";
  groomLabel: string;
  brideLabel: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  placeholder?: string;
}[] = [
  { key: "contact", groomLabel: "Groom Contact Number", brideLabel: "Bride Contact Number", inputMode: "numeric", maxLength: 10, placeholder: "10-digit mobile" },
  { key: "occupation", groomLabel: "Groom Occupation / Job Role", brideLabel: "Bride Occupation / Job Role" },
  { key: "village", groomLabel: "Groom Village", brideLabel: "Bride Village" },
];

/** Upload-field split for ordering after the age block but before the parent uploads. */
const MID_UPLOAD_KEYS = [
  "groom_aadhaar", "bride_aadhaar",
  "groom_tc", "bride_tc",
  "groom_ration", "bride_ration",
  "groom_photo", "bride_photo",
];
const PARENT_UPLOAD_KEYS = [
  "groom_father_aadhaar", "groom_mother_aadhaar",
  "bride_father_aadhaar", "bride_mother_aadhaar",
];

function fieldByKey(k: string) {
  return UPLOAD_FIELDS.find((u) => u.key === k)!;
}

function DetailsForm({
  t,
  data,
  onChange,
  onBack,
  onNext,
}: {
  t: (typeof T)[Lang];
  data: FormState;
  onChange: (d: FormState) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  function setPerson(who: "bride" | "groom", patch: Partial<Person>) {
    onChange({ ...data, [who]: { ...data[who], ...patch } });
  }

  function setUpload(key: string, file: UploadedFile | null) {
    onChange({ ...data, documents: { ...data.documents, [key]: file } });
  }

  const ageValid = (v: string) => /^\d{1,2}$/.test(v) && Number(v) >= 18 && Number(v) <= 99;
  const contactValid = (v: string) => /^\d{10}$/.test(v);

  const allValid = useMemo(() => {
    if (!ageValid(data.groom.age) || !ageValid(data.bride.age)) return false;
    if (!contactValid(data.groom.contact) || !contactValid(data.bride.contact)) return false;
    if (!data.groom.occupation.trim() || !data.bride.occupation.trim()) return false;
    if (!data.groom.village.trim() || !data.bride.village.trim()) return false;
    for (const f of UPLOAD_FIELDS) {
      if (!data.documents[f.key]?.uploaded) return false;
    }
    return true;
  }, [data]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid) {
      toast.error("Please complete all fields and uploads.");
      return;
    }
    onNext();
  }

  return (
    <form onSubmit={submit}>
      <Card
        desc={t.detailsDesc}
        footer={
          <>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-[14px] border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" /> {t.back}
            </button>
            <button
              type="submit"
              disabled={!allValid}
              className={cn(
                "inline-flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-semibold shadow-sm transition",
                allValid
                  ? "bg-primary text-primary-foreground hover:bg-[color:var(--olive-deep)]"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              {t.continue} <ArrowRight className="h-4 w-4" />
            </button>
          </>
        }
      >
        {/* Ages */}
        <SectionHeader title="Age" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Groom Age" required>
            <Input
              inputMode="numeric"
              maxLength={2}
              value={data.groom.age}
              placeholder="Years"
              onChange={(e) => setPerson("groom", { age: e.target.value.replace(/\D/g, "") })}
            />
          </Field>
          <Field label="Bride Age" required>
            <Input
              inputMode="numeric"
              maxLength={2}
              value={data.bride.age}
              placeholder="Years"
              onChange={(e) => setPerson("bride", { age: e.target.value.replace(/\D/g, "") })}
            />
          </Field>
        </div>

        {/* Mid uploads: aadhaar, TC, ration, photo (groom then bride pairs) */}
        <SectionHeader title="Document Uploads" />
        <div className="grid gap-4 sm:grid-cols-2">
          {MID_UPLOAD_KEYS.map((k) => {
            const f = fieldByKey(k);
            return (
              <UploadField
                key={k}
                label={f.label}
                regId={data.regId}
                docKey={k}
                value={data.documents[k]}
                onChange={(file) => setUpload(k, file)}
              />
            );
          })}
        </div>

        {/* Text pairs: contact, occupation, village (groom then bride) */}
        <SectionHeader title="Contact, Occupation & Village" />
        <div className="grid gap-5 sm:grid-cols-2">
          {TEXT_PAIRS.flatMap((p) => [
            <Field key={`g-${p.key}`} label={p.groomLabel} required>
              <Input
                inputMode={p.inputMode}
                maxLength={p.maxLength}
                placeholder={p.placeholder}
                value={data.groom[p.key]}
                onChange={(e) => {
                  const v = p.inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value;
                  setPerson("groom", { [p.key]: v } as Partial<Person>);
                }}
              />
            </Field>,
            <Field key={`b-${p.key}`} label={p.brideLabel} required>
              <Input
                inputMode={p.inputMode}
                maxLength={p.maxLength}
                placeholder={p.placeholder}
                value={data.bride[p.key]}
                onChange={(e) => {
                  const v = p.inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value;
                  setPerson("bride", { [p.key]: v } as Partial<Person>);
                }}
              />
            </Field>,
          ])}
        </div>

        {/* Parent uploads at the end */}
        <SectionHeader title="Parent Aadhaar Cards" />
        <div className="grid gap-4 sm:grid-cols-2">
          {PARENT_UPLOAD_KEYS.map((k) => {
            const f = fieldByKey(k);
            return (
              <UploadField
                key={k}
                label={f.label}
                regId={data.regId}
                docKey={k}
                value={data.documents[k]}
                onChange={(file) => setUpload(k, file)}
              />
            );
          })}
        </div>

        {!allValid && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Complete every field and upload every document to enable Continue.
          </p>
        )}
      </Card>
    </form>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 mt-6 flex items-center gap-3 first:mt-0">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--olive-deep)]">
        {title}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ---------- Upload field with preview ---------- */

function UploadField({
  label,
  regId,
  docKey,
  value,
  onChange,
}: {
  label: string;
  regId: string;
  docKey: string;
  value: UploadedFile | null;
  onChange: (f: UploadedFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(f: File | null) {
    setError(null);
    if (!f) {
      onChange(null);
      return;
    }
    if (!isAcceptedFile(f)) {
      setError("Unsupported file. Use PDF, JPG, PNG, WEBP or HEIC.");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_FILE_MB} MB limit.`);
      return;
    }
    const isImage = f.type.startsWith("image/") && !/heic|heif/.test(f.type);
    let preview: string | undefined;
    if (isImage) {
      preview = await new Promise<string | undefined>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(f);
      });
    }
    // Local preview only — not yet persisted.
    onChange({ name: f.name, size: f.size, type: f.type, dataUrl: preview });

    // Persist to Supabase Storage (signed URL flow). `uploaded` flips true only
    // after the server confirms, so a failed upload can't enable Continue.
    setUploading(true);
    try {
      await uploadFileViaSignedUrl(f, regId, docKey);
      onChange({
        name: f.name,
        size: f.size,
        type: f.type,
        dataUrl: preview,
        uploaded: true,
      });
    } catch (err) {
      console.error("[supabase] document upload failed", { docKey, err });
      setError("Upload failed. Please try again or replace the file.");
      toast.error(`Couldn't upload ${label}.`);
    } finally {
      setUploading(false);
    }
  }

  const uploaded = !!value?.uploaded;
  const hasLocalFile = !!value;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[14px] border p-4 transition",
        uploaded
          ? "border-[color:var(--olive)]/50 bg-[color:var(--olive)]/[0.04]"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[color:var(--olive)]/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{label}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Required · PDF / JPG / PNG / HEIC · Max {MAX_FILE_MB} MB
            </div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            uploaded
              ? "bg-[color:var(--olive)]/10 text-primary"
              : hasLocalFile
                ? "bg-[color:var(--gold)]/15 text-[color:var(--gold-foreground)]"
                : "bg-destructive/10 text-destructive",
          )}
        >
          {uploaded ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
            </>
          ) : hasLocalFile ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          ) : (
            "Missing"
          )}
        </span>
      </div>

      {value && (
        <div className="flex items-center gap-3 rounded-[10px] bg-secondary p-2">
          {value.dataUrl ? (
            <img
              src={value.dataUrl}
              alt={value.name}
              className="h-16 w-16 shrink-0 rounded-[8px] border border-border object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[8px] border border-border bg-white text-primary">
              <FileText className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-foreground">{value.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {(value.size / 1024).toFixed(0)} KB · {value.type || "file"}
            </div>
          </div>
          <button
            type="button"
            aria-label="Remove file"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="grid h-8 w-8 place-items-center rounded-[8px] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-[color:var(--olive-deep)]",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" /> {hasLocalFile ? "Replace" : "Upload"}
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </label>
        {uploaded && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove
          </button>
        )}
      </div>

      {error && <div className="text-xs font-medium text-destructive">{error}</div>}
    </div>
  );
}

/* ---------- Review ---------- */

function ReviewPage({
  t,
  data,
  onChange,
  onBack,
  onSubmit,
  submitting = false,
}: {
  t: (typeof T)[Lang];
  data: FormState;
  onChange: (d: FormState) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  const uploaded = UPLOAD_FIELDS.filter((d) => data.documents[d.key]?.uploaded).length;
  return (
    <Card
      desc={t.reviewDesc}
      footer={
        <>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-[14px] border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </button>
          <button
            onClick={onSubmit}
            disabled={!data.confirmed || submitting}
            className={cn(
              "inline-flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-semibold shadow-sm transition",
              data.confirmed
                ? "bg-primary text-primary-foreground hover:bg-[color:var(--olive-deep)]"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {t.submit}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <Section title="Basic Details">
          <Row label={t.bride} value={data.brideName} />
          <Row label={t.groom} value={data.groomName} />
          <Row label={t.mobile} value={data.mobile} />
          <Row label={t.whatsapp} value={data.sameNumber ? data.mobile : data.whatsapp} />
          <Row label={t.district} value={data.district} />
          <Row label={t.state} value={data.state} />
          <Row label={t.city} value={data.city} />
        </Section>
        <Section title="Personal Details">
          <Row label="Groom Age" value={data.groom.age} />
          <Row label="Bride Age" value={data.bride.age} />
          <Row label="Groom Contact" value={data.groom.contact} />
          <Row label="Bride Contact" value={data.bride.contact} />
          <Row label="Groom Occupation" value={data.groom.occupation} />
          <Row label="Bride Occupation" value={data.bride.occupation} />
          <Row label="Groom Village" value={data.groom.village} />
          <Row label="Bride Village" value={data.bride.village} />
        </Section>
        <Section title="Payment">
          <Row label="Status" value={data.paymentStatus === "paid" ? "Successful — ₹99" : "Pending"} />
          {data.paymentRef && <Row label="Reference" value={data.paymentRef} />}
        </Section>
        <Section title="Documents">
          <Row label="Uploaded" value={`${uploaded} / ${UPLOAD_FIELDS.length}`} />
        </Section>
        <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-[14px] border border-[color:var(--olive)]/30 bg-[color:var(--olive)]/[0.06] p-4">
          <Checkbox
            checked={data.confirmed}
            onCheckedChange={(v) => onChange({ ...data, confirmed: !!v })}
            className="mt-0.5"
          />
          <span className="text-sm text-foreground">{t.confirm}</span>
        </label>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-border bg-card">
      <div className="border-b border-border bg-[color:var(--cream)]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--olive-deep)]">
        {title}
      </div>
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] items-start gap-3 px-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function SearchableInput({
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 8);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [value, suggestions]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && filtered[highlight]) {
            e.preventDefault();
            onChange(filtered[highlight]);
            setOpen(false);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[12px] border border-border bg-popover p-1 text-sm shadow-lg"
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setOpen(false);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "cursor-pointer rounded-[8px] px-3 py-2",
                i === highlight
                  ? "bg-[color:var(--cream)] text-[color:var(--olive-deep)]"
                  : "text-foreground",
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
