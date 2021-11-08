export const USERNAME_KEY = 'username';

export const saveItem = (key: string, value: any) => {
  if(!key || !value) {
    console.error('getItem should has a key and a value')
  }

  if (!window || !window.localStorage) {
    console.error('saveItem should be used in the client side')
  }
  localStorage.setItem(key, value);
};

export const getItem = (key: string) => {
  if(!key) {
    console.error('getItem should has a key')
  }

  if (!window || !window.localStorage) {
    console.error('getItem should be used in the client side')
  }

  return localStorage.getItem(key);
};
