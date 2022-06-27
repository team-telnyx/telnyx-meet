import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';
import { notify } from 'lib/bugsnag';

export const generateId = (): number => Math.ceil(Math.random() * 1000000);

export const generateUsername = (): string =>
  uniqueNamesGenerator({
    dictionaries: [colors, animals],
    style: 'capital',
    separator: ' ',
  });

export const transformFetchErrorToBugsnag = (
  requestId: string,
  errorMessage: string,
  status: number
) => {
  try {
    const error = errorMessage || 'Failed';
    notify(`request-id: ${requestId} - ${status}: ${error}`);
  } catch (error) {
    notify(`request-id: ${requestId} - ${error}`);
  }
};
