export const saveItem = (key: string, value: any) => {
  if(!key || !value) {
    throw new Error('getItem should has a key and a value')
  }

  if (!window || !window.localStorage) {
    throw new Error('saveItem should be used in the client side')
  }
  localStorage.setItem(key, value);
};

export const getItem = (key: string) => {
  if(!key) {
    throw new Error('getItem should has a key')
  }

  if (!window || !window.localStorage) {
    throw new Error('getItem should be used in the client side')
  }

  return localStorage.getItem(key);
};
