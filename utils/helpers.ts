import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';

export const generateId = (): number => Math.ceil(Math.random() * 1000000);

export const generateUsername = (): string =>
  uniqueNamesGenerator({
    dictionaries: [colors, animals],
    style: 'capital',
    separator: ' ',
  });
