// Sends the uninstall feedback form's answers to the Kurippu API.
// The wire format is documented in docs/feedback-endpoint.md. Nothing here touches Google Analytics, and
// the answers are never written to storage.

/** What a visitor chose to tell us. Every field is optional, and empty ones are left out. */
export interface FeedbackAnswers {
  /** Ids of the ticked reasons, as listed in components/feedback/FeedbackForm.astro. */
  reasons: string[];
  /** What the visitor switched to. Only present when the "switched" reason is ticked. */
  switchedTo?: string;
  /** Id of the chosen length of use, such as "weeks". */
  duration?: string;
  /** The free-text note. */
  message?: string;
  /** Only present when the visitor ticked "You can email me" and typed an address. */
  email?: string;
}

interface SendOptions {
  /** True in `npm run dev`: pretend to send, so local work never posts real feedback anywhere. */
  development: boolean;
}

/** Bump when the shape of the posted JSON changes, so the receiving end can tell the versions apart. */
const PAYLOAD_VERSION = 1;
/** How long the dev build pretends to send, so the "Sending..." state is visible. */
const SIMULATED_SEND_MS = 700;
/** Give up on a slow endpoint after this long, so the visitor gets the retry message instead of a stuck button. */
const SEND_TIMEOUT_MS = 15000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Resolves when the endpoint accepted the answers. Rejects on any failure. */
export async function sendFeedback(answers: FeedbackAnswers, { development }: SendOptions): Promise<void> {
  if (development) {
    await sleep(SIMULATED_SEND_MS);
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.kurippu.com/uninstall/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: PAYLOAD_VERSION, ...answers }),
      // No cookies and no referrer: the endpoint learns nothing about the visitor beyond the answers.
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`The feedback endpoint answered ${response.status}.`);
  } finally {
    clearTimeout(timeout);
  }
}
