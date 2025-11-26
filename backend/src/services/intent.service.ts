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
        query: message,
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

