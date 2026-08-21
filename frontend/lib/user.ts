const USER_ID_KEY = 'mailops_user_id';

export const getOrCreateUserId = (): string => {
  if (typeof window === 'undefined') {
    return 'server';
  }

  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(USER_ID_KEY, id);
  return id;
};
