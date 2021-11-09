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
    body: 'Telnyx Meet needs access to your camera and microphone so that other participants can see and hear you. Telnyx Meet will ask you to confirm this decision on each browser and computer you use.',
  }
};
