export const getUserMedia = async (
  constraints: MediaStreamConstraints
): Promise<MediaStream> => {
  return await window?.navigator?.mediaDevices?.getUserMedia(constraints);
};

export const MediaDeviceErrors = {
  mediaBlocked: {
    title: 'Camera and microphone are blocked',
    body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
  },
  allowMediaWarning: {
    title: 'Allow Telnyx Meet to use your camera and microphone',
    body: 'Telnyx Meet requires access to your camera and microphone to let other participants see and hear you.',
  }
};
