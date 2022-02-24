export const getUserMedia = async (
  // TODO: avoid disable line
  // eslint-disable-next-line no-undef
  constraints: MediaStreamConstraints
): Promise<MediaStream> => {
  return await window?.navigator?.mediaDevices?.getUserMedia(constraints);
};

export const MediaDeviceErrors = {
  mediaBlocked: {
    title: 'Camera and microphone are blocked',
    body: 'Telnyx Meet requires access to your camera and microphone.',
  },
  allowMediaWarning: {
    title: 'Allow Telnyx Meet to use your camera and microphone',
    body: 'Telnyx Meet requires access to your camera and microphone to let other participants see and hear you.',
  },
};
