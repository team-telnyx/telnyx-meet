export const MediaDeviceErrors = {
  audioBlocked: {
    type: 'audioBlocked',
    message: {
      title: 'Microphone is blocked',
      body: 'Telnyx Meet requires access to your microphone.',
    },
  },
  videoBlocked: {
    type: 'videoBlocked',
    message: {
      title: 'Camera is blocked',
      body: 'Telnyx Meet requires access to your camera.',
    },
  },
  allowMediaWarning: {
    type: 'allowMediaWarning',
    message: {
      title: 'Allow Telnyx Meet to use your camera and microphone',
      body: 'Telnyx Meet requires access to your camera and microphone to let other participants see and hear you.',
    },
  },
};
