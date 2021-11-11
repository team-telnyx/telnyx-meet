export const USERNAME_KEY = 'username';
export const USER_PREFERENCE_AUDIO_ALLOWED_KEY = 'audioAllowed';
export const USER_PREFERENCE_VIDEO_ALLOWED_KEY = 'videoAllowed';

export const saveItem = (key: string, value: string) => {
  if (!key || !value) {
    throw new Error('key and value must be provided');
  }

  if (!window || !window.localStorage) {
    console.warn('localStorage not supported');
  }
  localStorage.setItem(key, value);
};

export const getItem = (key: string) => {
  if (!key) {
    throw new Error('No key provided');
  }

  if (!window || !window.localStorage) {
    console.warn('localStorage not supported');
  }

  return localStorage.getItem(key);
};
