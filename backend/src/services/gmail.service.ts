import { google } from 'googleapis';
import { oauth2Client } from '../config/googleOAuth.js';
import { parseEmailList } from '../utils/emailParser.js';

const getGmailClient = (tokens: any) => {
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

export const readInbox = async (tokens: any, maxResults: number = 10, query?: string): Promise<any[]> => {
  const gmail = getGmailClient(tokens);
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query,
  });

  if (!response.data.messages || response.data.messages.length === 0) {
    return [];
  }

  const messageIds = response.data.messages.map((msg: any) => msg.id);
  const messages = await Promise.all(
    messageIds.map((id: string) =>
      gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      })
    )
  );

  return parseEmailList(messages.map((res: any) => res.data));
};

export const summarizeEmails = async (tokens: any, query?: string): Promise<string> => {
  const emails = await readInbox(tokens, 20);
  
  if (emails.length === 0) {
    return 'No emails found in your inbox.';
  }

  const summary = emails
    .slice(0, 10)
    .map(
      (email, idx) =>
        `${idx + 1}. From: ${email.from}\n   Subject: ${email.subject}\n   Preview: ${email.snippet}\n`
    )
    .join('\n');

  return `Here's a summary of your recent emails:\n\n${summary}`;
};

export const sendEmail = async (tokens: any, to: string, subject: string, body: string): Promise<void> => {
  const gmail = getGmailClient(tokens);
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
};

