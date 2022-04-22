export const getVideoConstraints = (
  videoInputDeviceId: string | undefined,
  optionalFeatures: { [key: string]: boolean }
) => {
  if (
    (!videoInputDeviceId && !optionalFeatures) ||
    (!videoInputDeviceId && !optionalFeatures.isSimulcastEnabled)
  ) {
    return true;
  }

  const videoConstraints: {
    deviceId?: string;
    width?: number;
    height?: number;
  } = {};

  if (videoInputDeviceId) {
    videoConstraints.deviceId = videoInputDeviceId;
  }

  if (optionalFeatures && optionalFeatures.isSimulcastEnabled) {
    videoConstraints.width = 1280;
    videoConstraints.height = 720;
  }

  return videoConstraints;
};
