// Controller for the uninstall feedback form (components/feedback/FeedbackForm.astro) on /uninstalled/.
// It keeps the note counter, checks the optional email, sends the answers (see submit.ts), then swaps the
// form for the thank-you view. Visitor text is only ever read from fields and written back with textContent.
import { sendFeedback, type FeedbackAnswers } from './submit';

/** Deliberately loose: something@something.tld. The receiving end is free to be stricter. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SEND_LABEL = 'Send feedback';
const SENDING_LABEL = 'Sending…';

/** Finds a required element, and says which one is missing if the markup and this script drift apart. */
function find<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`The feedback form is missing ${selector}.`);
  return element;
}

/** The answers the visitor gave, with empty fields left out. */
function readAnswers(form: HTMLFormElement): FeedbackAnswers {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? '').trim();

  const reasons = data.getAll('reason').map(String);
  const answers: FeedbackAnswers = { reasons };
  if (reasons.includes('switched') && text('switchedTo')) answers.switchedTo = text('switchedTo');
  if (text('duration')) answers.duration = text('duration');
  if (text('message')) answers.message = text('message');
  if (data.get('reply') && text('email')) answers.email = text('email');
  return answers;
}

/** True when there is something besides an email address to send. */
function hasAnswers(answers: FeedbackAnswers): boolean {
  return answers.reasons.length > 0 || Boolean(answers.duration) || Boolean(answers.message);
}

export function mountFeedbackForm() {
  const form = document.querySelector<HTMLFormElement>('[data-feedback-form]');
  if (!form) return;

  const development = form.dataset.development === 'true';
  const messageLimit = Number(form.dataset.messageLimit) || 1000;

  const formView = find<HTMLElement>(document, '[data-feedback-form-view]');
  const thanksView = find<HTMLElement>(document, '[data-feedback-thanks-view]');
  const thanksTitle = find<HTMLElement>(thanksView, '[data-feedback-thanks-title]');
  const thanksEmailLine = find<HTMLElement>(thanksView, '[data-feedback-thanks-email]');

  const message = find<HTMLTextAreaElement>(form, '[data-feedback-message]');
  const counter = find<HTMLElement>(form, '[data-feedback-count]');
  const replyBox = find<HTMLInputElement>(form, '[data-feedback-reply]');
  const email = find<HTMLInputElement>(form, '[data-feedback-email]');
  const emailError = find<HTMLElement>(form, '[data-feedback-email-error]');
  const emailErrorText = find<HTMLElement>(emailError, '[data-feedback-email-error-text]');
  const alertBox = find<HTMLElement>(form, '[data-feedback-alert]');
  const alertTitle = find<HTMLElement>(alertBox, '[data-feedback-alert-title]');
  const alertText = find<HTMLElement>(alertBox, '[data-feedback-alert-text]');
  const sendButton = find<HTMLButtonElement>(form, '[data-feedback-send]');
  const sendLabel = find<HTMLElement>(sendButton, '[data-feedback-send-label]');
  const trap = find<HTMLInputElement>(form, '[data-feedback-trap]');

  let sending = false;

  // The note's counter, with a bolder look at the limit so it is clear why typing stopped.
  const updateCounter = () => {
    const length = message.value.length;
    counter.textContent = `${length.toLocaleString('en-US')} / ${messageLimit.toLocaleString('en-US')}`;
    counter.classList.toggle('is-at-limit', length >= messageLimit);
  };
  message.addEventListener('input', updateCounter);
  updateCounter();

  const showEmailError = (problem: string) => {
    emailErrorText.textContent = problem;
    emailError.hidden = false;
    email.setAttribute('aria-invalid', 'true');
  };
  const clearEmailError = () => {
    emailError.hidden = true;
    email.removeAttribute('aria-invalid');
  };
  email.addEventListener('input', clearEmailError);
  replyBox.addEventListener('change', clearEmailError);

  /** The email problem to show, or null when there is none. Only checked when the visitor asked for a reply. */
  const emailProblem = (): string | null => {
    if (!replyBox.checked) return null;
    const value = email.value.trim();
    if (value === '') return 'Add your email address, or untick the box.';
    if (!EMAIL_PATTERN.test(value)) return 'That doesn’t look like an email address.';
    return null;
  };

  const showAlert = (title: string, text: string) => {
    alertTitle.textContent = title;
    alertText.textContent = text;
    alertBox.hidden = false;
  };
  const hideAlert = () => {
    alertBox.hidden = true;
  };

  const setSending = (isSending: boolean) => {
    sending = isSending;
    sendButton.disabled = isSending;
    sendLabel.textContent = isSending ? SENDING_LABEL : SEND_LABEL;
  };

  const showThanks = (wroteEmail: boolean) => {
    thanksEmailLine.hidden = !wroteEmail;
    formView.hidden = true;
    thanksView.hidden = false;
    window.scrollTo(0, 0);
    thanksTitle.focus();
  };

  // Every question is optional, and the browser cannot clear a radio button. A second click on the chosen
  // length of use therefore clears it. The label sees the press first, before the radio changes.
  form.querySelectorAll<HTMLInputElement>('input[name="duration"]').forEach((radio) => {
    const label = radio.closest('label');
    label?.addEventListener('pointerdown', () => {
      radio.dataset.wasChecked = String(radio.checked);
    });
    radio.addEventListener('click', () => {
      if (radio.dataset.wasChecked === 'true') radio.checked = false;
      delete radio.dataset.wasChecked;
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;

    const problem = emailProblem();
    if (problem) {
      showEmailError(problem);
      email.focus();
      return;
    }

    const answers = readAnswers(form);
    if (!hasAnswers(answers)) {
      showAlert('Nothing to send yet.', 'Pick a reason or write a note, or skip below.');
      return;
    }

    hideAlert();
    setSending(true);
    try {
      // A filled-in trap field means a bot: look like a success, send nothing.
      if (trap.value === '') await sendFeedback(answers, { development });
      showThanks(Boolean(answers.email));
    } catch {
      showAlert('We couldn’t send that.', 'Check your connection and try again. Nothing you typed has been lost.');
    } finally {
      setSending(false);
    }
  });
}
