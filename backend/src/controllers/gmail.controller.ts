import { readInbox, summarizeEmails, sendEmail } from '../services/gmail.service.js';
import { GmailIntent } from '../types/index.js';

export const handleGmailAction = async (
  intent: GmailIntent,
  tokens: any
): Promise<string> => {
  switch (intent.type) {
    case 'read':
      const emails = await readInbox(tokens, 10);
      if (emails.length === 0) {
        return 'Your inbox is empty.';
      }
      return `Found ${emails.length} emails:\n\n${emails
        .map(
          (email, idx) =>
            `${idx + 1}. From: ${email.from}\n   Subject: ${email.subject}\n   Preview: ${email.snippet}`
        )
        .join('\n\n')}`;

    case 'summarize':
      return await summarizeEmails(tokens, intent.details?.query);

    case 'send':
      if (!intent.details?.recipient || !intent.details?.subject) {
        throw new Error('Missing recipient or subject. Please provide both email address and subject.');
      }
      await sendEmail(
        tokens,
        intent.details.recipient,
        intent.details.subject,
        intent.details.body || 'No body provided'
      );
      return `Email sent successfully to ${intent.details.recipient}`;

    default:
      throw new Error('Unknown Gmail action.');
  }
};

