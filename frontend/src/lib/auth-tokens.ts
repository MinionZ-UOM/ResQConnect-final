const ACCESS_TOKEN_KEY = 'access_token';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const getStorage = (): StorageLike | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
};

export const getAccessToken = (): string | null => {
  const storage = getStorage();
  return storage?.getItem(ACCESS_TOKEN_KEY) ?? null;
};

export const setAccessToken = (token: string) => {
  const storage = getStorage();
  storage?.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  const storage = getStorage();
  storage?.removeItem(ACCESS_TOKEN_KEY);
};
