export const PEER_TOOLKITS = [
  'gmail',
  'googlecalendar',
  'slack',
  'notion',
  'googledrive',
] as const;

export type PeerToolkit = (typeof PEER_TOOLKITS)[number];

export const TOOLKIT_META: Record<
  PeerToolkit,
  { label: string; description: string }
> = {
  gmail: {
    label: 'Gmail',
    description: 'Read and send email',
  },
  googlecalendar: {
    label: 'Google Calendar',
    description: 'Create and update events',
  },
  slack: {
    label: 'Slack',
    description: 'Read channels and post messages',
  },
  notion: {
    label: 'Notion',
    description: 'Read pages and create tasks',
  },
  googledrive: {
    label: 'Google Drive',
    description: 'Find and upload files',
  },
};

/** Tool name fragments that typically mutate external state. */
const WRITE_PATTERNS = [
  'SEND',
  'CREATE',
  'UPDATE',
  'DELETE',
  'REMOVE',
  'POST',
  'UPLOAD',
  'WRITE',
  'INSERT',
  'ADD',
  'REPLY',
  'FORWARD',
  'MOVE',
  'TRASH',
  'ARCHIVE',
  'MODIFY',
  'SET_',
  'PATCH',
  'PUBLISH',
  'INVITE',
  'SCHEDULE',
];

export const isWriteTool = (toolName: string): boolean => {
  const upper = toolName.toUpperCase();
  // Meta tools for auth / discovery are not user-facing writes
  if (upper.startsWith('COMPOSIO_')) return false;
  return WRITE_PATTERNS.some((pattern) => upper.includes(pattern));
};
