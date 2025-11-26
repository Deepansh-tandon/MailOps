export interface ParsedEmail {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

export const parseEmailList = (emails: any[]): ParsedEmail[] => {
  return emails.map((email) => ({
    id: email.id,
    subject: email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
    from: email.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown',
    snippet: email.snippet || '',
    date: email.payload?.headers?.find((h: any) => h.name === 'Date')?.value || '',
  }));
};

