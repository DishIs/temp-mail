// app/api/waitlist/route.ts
import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

// ─── Blocked domains ────────────────────────────────────────────────────────
// Never exposed to the client — lives only on the server.
const BLOCKED_DOMAINS = new Set([
  // ── Our own disposable service ──────────────────────────────────────────
  "ditube.info",
  "ditapi.info",

  // ── Common disposable / temp-mail providers ─────────────────────────────
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamail.info",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "spam4.me",
  "trashmail.com",
  "trashmail.at",
  "trashmail.io",
  "trashmail.me",
  "trashmail.net",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempr.email",
  "dispostable.com",
  "yopmail.com",
  "yopmail.fr",
  "cool.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",
  "nomail.xl.cx",
  "mega.zik.dj",
  "speed.1s.fr",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "10minutemail.co.uk",
  "10minutemail.de",
  "10minutemail.ru",
  "mailnull.com",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamgourmet.org",
  "throwam.com",
  "throwam.net",
  "mailnesia.com",
  "maildrop.cc",
  "mailnull.com",
  "spamfree24.org",
  "spamgob.com",
  "fakeinbox.com",
  "mailforspam.com",
  "throwaway.email",
  "getnada.com",
  "discard.email",
  "spamherelots.com",
  "spamhereplease.com",
  "sendspamhere.com",
  "incognitomail.com",
  "mailnull.com",
  "trashcanmail.com",
  "mailnew.com",
  "sharklasers.com",
  "guerrillamail.com",
  "byom.de",
  "filzmail.com",
  "jetable.com",
  "jetable.net",
  "jetable.org",
  "jetable.fr",
  "notsharingmy.info",
  "nospammail.net",
  "ownmail.net",
  "spamcorner.com",
  "inboxalias.com",
  "spamdecoy.net",
  "spamgob.com",
  "spaml.de",
  "spamspot.com",
  "spamstack.net",
  "spamtrap.ro",
  "spamtrail.com",
  "kasmail.com",
  "postshift.com",
  "spam.la",
  "sofimail.com",
  "sneakemail.com",
  "safetymail.info",
  "inoutmail.de",
  "inoutmail.eu",
  "inoutmail.info",
  "inoutmail.net",
  "hide.biz.st",
  "hmamail.com",
  "hot-mail.ru",
  "throwam.com",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "einrot.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
]);

// ─── Allowed waitlist sources ────────────────────────────────────────────────
// Values the client is allowed to send. Anything else is rejected.
const ALLOWED_SOURCES = new Set([
  "make",
  "zapier",
  // add more integration pages here as you build them
]);

// Maps a source slug → human-readable Brevo attribute value
const SOURCE_LABEL: Record<string, string> = {
  make:   "waitlist_make",
  zapier: "waitlist_zapier",
};

// Per-source Brevo list IDs (set env vars or leave unset to skip list assignment)
const SOURCE_LIST_ENV: Record<string, string> = {
  make:   "BREVO_WAITLIST_MAKE_LIST_ID",
  zapier: "BREVO_WAITLIST_ZAPIER_LIST_ID",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() ?? "";
}

function isTempMail(email: string): boolean {
  const domain = extractDomain(email);
  if (!domain) return true;

  // Exact match
  if (BLOCKED_DOMAINS.has(domain)) return true;

  // Catch sub-domains of blocked providers
  for (const blocked of BLOCKED_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }

  return false;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ─── POST /api/waitlist ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email: string  = (body.email  ?? "").trim().toLowerCase();
    const token: string  = (body.token  ?? "").trim();
    const source: string = (body.source ?? "").trim().toLowerCase();

    // ── Turnstile verification ────────────────────────────────────────────
    if (!token) {
      return NextResponse.json(
        { error: "CAPTCHA token is missing." },
        { status: 400 }
      );
    }

    const isHuman = await verifyTurnstileToken(token);
    if (!isHuman) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      );
    }

    // ── Source validation ─────────────────────────────────────────────────
    if (!source || !ALLOWED_SOURCES.has(source)) {
      return NextResponse.json(
        { error: "Invalid request source." },
        { status: 400 }
      );
    }

    // ── Basic email validation ────────────────────────────────────────────
    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 422 }
      );
    }

    // ── Temp-mail guard (server-side only) ────────────────────────────────
    if (isTempMail(email)) {
      // Generic message — never reveal which domains are blocked.
      return NextResponse.json(
        { error: "Please use a permanent email address to join the waitlist." },
        { status: 422 }
      );
    }

    // ── Brevo: create / update contact ────────────────────────────────────
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("[waitlist] BREVO_API_KEY env var is not set.");
      return NextResponse.json(
        { error: "Server configuration error. Please try again later." },
        { status: 500 }
      );
    }

    // Resolve a source-specific list ID if configured, fall back to the
    // generic list ID, then fall back to no list assignment.
    const listEnvKey   = SOURCE_LIST_ENV[source];
    const listIdStr    = process.env[listEnvKey] ?? process.env.BREVO_WAITLIST_LIST_ID;
    const listIds      = listIdStr ? [Number(listIdStr)] : undefined;

    const brevoPayload: Record<string, unknown> = {
      email,
      updateEnabled: true,
      ...(listIds && { listIds }),
      attributes: {
        // Stored on the contact so you can segment / filter in Brevo
        WAITLIST_SOURCE: SOURCE_LABEL[source],
      },
    };

    const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    // 201 = created, 204 = updated (updateEnabled matched an existing contact)
    if (brevoRes.status === 201 || brevoRes.status === 204) {
      return NextResponse.json(
        { success: true, message: "You're on the list! We'll notify you." },
        { status: 200 }
      );
    }

    // Brevo returned an error — log and return a safe message
    const brevoError = await brevoRes.json().catch(() => ({}));
    console.error("[waitlist] Brevo error:", brevoRes.status, brevoError);

    // Shouldn't normally hit because updateEnabled:true handles duplicates,
    // but guard it just in case.
    if (
      brevoRes.status === 400 &&
      (brevoError as { code?: string }).code === "duplicate_parameter"
    ) {
      return NextResponse.json(
        { success: true, message: "You're already on the list!" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Failed to join the waitlist. Please try again." },
      { status: 502 }
    );
  } catch (err) {
    console.error("[waitlist] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}