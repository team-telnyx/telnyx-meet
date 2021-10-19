import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';

export const generateId = (): number => Math.ceil(Math.random() * 1000000);

export const generateUsername = (): string =>
  uniqueNamesGenerator({
    dictionaries: [colors, animals],
    style: 'capital',
    separator: ' ',
  });

export enum USER_SCOPE {
  RUNSCOPE = 'runscope',
  VIDEO_SQUAD = 'video-squad',
}

export const getAPIKey = (userScope: USER_SCOPE): string => {
  switch (userScope) {
    case USER_SCOPE.RUNSCOPE:
      return process.env.TELNYX_RUNSCOPE_API_KEY!
    case USER_SCOPE.VIDEO_SQUAD:
      return process.env.TELNYX_VIDEO_SQUAD_API_KEY!
    default:
      return process.env.TELNYX_API_KEY!
  }
};
