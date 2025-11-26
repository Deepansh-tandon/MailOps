import { GmailIntent } from '../types/index.js';

export const detectGmailIntent = (userMessage: string): GmailIntent => {
  const message = userMessage.toLowerCase().trim();
  
  // Check for send email intent
  if (
    message.includes('send') && 
    (message.includes('email') || message.includes('mail') || message.includes('message'))
  ) {
    return {
      type: 'send',
      confidence: 0.8,
      details: {
        recipient: extractEmail(message),
        subject: extractSubject(message),
        body: extractBody(message),
      },
    };
  }

  // Check for summarize intent
  if (
    message.includes('summarize') || 
    message.includes('summary') ||
    (message.includes('what') && message.includes('email'))
  ) {
    return {
      type: 'summarize',
      confidence: 0.7,
      details: {
        query: extractGmailQuery(message),
      },
    };
  }

  // Check for read intent
  if (
    message.includes('read') || 
    message.includes('show') ||
    message.includes('list') ||
    message.includes('inbox') 
  ) {
    return {
      type: 'read',
      confidence: 0.7,
      details: {
        query: message,
      },
    };
  }

  return {
    type: 'none',
    confidence: 0,
  };
};

const extractEmail = (message: string): string => {
  const matches = message.match(/[\w\.-]+@[\w\.-]+\.\w+/g);
  return matches?.[0] || '';
};

const extractSubject = (message: string): string => {
  const match = message.match(/subject[:\s]+([^\n]+)/i);
  return match?.[1]?.trim() || '';
};

const extractBody = (message: string): string => {
  const match = message.match(/body[:\s]+([^\n]+)/i) || 
                message.match(/message[:\s]+([^\n]+)/i) ||
                message.match(/content[:\s]+([^\n]+)/i);
  return match?.[1]?.trim() || '';
};

const extractGmailQuery = (message: string): string | undefined => {
  // Extract sender from patterns like:
  // "from paypal", "from: paypal", "emails from paypal", "mails from paypal"
  const fromMatch = message.match(/(?:from|sender)[:\s]+([a-zA-Z0-9@\.\-_]+)/i);
  if (fromMatch) {
    const sender = fromMatch[1].trim();
    // If it's an email, use as-is, otherwise assume it's a domain/name
    if (sender.includes('@')) {
      return `from:${sender}`;
    } else {
      // Try both domain and name variations
      return `from:${sender}`;
    }
  }

  // Extract subject from patterns like:
  // "subject: invoice", "with subject invoice"
  const subjectMatch = message.match(/(?:subject|title)[:\s]+([^\n]+?)(?:\s|$)/i);
  if (subjectMatch) {
    return `subject:${subjectMatch[1].trim()}`;
  }

  // Extract date patterns like "last week", "this month", "yesterday"
  if (message.includes('yesterday')) {
    return 'newer_than:1d';
  }
  if (message.includes('last week') || message.includes('past week')) {
    return 'newer_than:7d';
  }
  if (message.includes('last month') || message.includes('past month')) {
    return 'newer_than:30d';
  }
  if (message.includes('this week')) {
    return 'newer_than:7d';
  }
  if (message.includes('this month')) {
    return 'newer_than:30d';
  }

  // If no specific query found, return undefined to search all emails
  return undefined;
};

