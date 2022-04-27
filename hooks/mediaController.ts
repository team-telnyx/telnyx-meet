import { useContext, useState, useEffect } from 'react';

import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import { MediaDeviceErrors } from 'components/MediaPreview/helper';

const getUserMedia = async (constraints: MediaStreamConstraints) => {
  return await navigator?.mediaDevices?.getUserMedia(constraints);
};

const getVideoConstraints = (
  videoInputDeviceId: string | undefined,
  optionalFeatures: { [key: string]: boolean }
) => {
  if (
    !optionalFeatures ||
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

export function useMediaController() {
  const {
    audioInputDeviceId,
    videoInputDeviceId,
    isAudioTrackEnabled,
    isVideoTrackEnabled,
    setIsAudioTrackEnabled,
    setIsVideoTrackEnabled,
    optionalFeatures,
    setError,
  } = useContext(TelnyxMeetContext);

  const [localTracks, setLocalTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });

  const handleTrackUpdate = (
    kind: 'audio' | 'video',
    value: MediaStreamTrack | undefined
  ) => setLocalTracks((tracks) => ({ ...tracks, [kind]: value }));

  // TODO: handle deviceId changes better
  useEffect(() => {
    if (localTracks.audio && audioInputDeviceId) {
      localTracks.audio.stop();
      handleTrackUpdate('audio', undefined);
      return;
    }

    if (localTracks.video && videoInputDeviceId) {
      localTracks.video.stop();
      handleTrackUpdate('video', undefined);
      return;
    }

    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioInputDeviceId, videoInputDeviceId]);

  // Audio controller
  useEffect(() => {
    if (localTracks.audio && !isAudioTrackEnabled) {
      localTracks.audio.stop();
      handleTrackUpdate('audio', undefined);
      return;
    }

    if (!localTracks.audio && isAudioTrackEnabled) {
      getUserMedia({
        audio: audioInputDeviceId ? { deviceId: audioInputDeviceId } : true,
      })
        .then((stream) => {
          handleTrackUpdate('audio', stream?.getAudioTracks()[0]);
        })
        .catch((error) => {
          if (
            error instanceof DOMException &&
            error.name === 'NotAllowedError'
          ) {
            setIsAudioTrackEnabled(false);
            setError(MediaDeviceErrors.audioBlocked);
          }
        });
    }

    return () => {
      if (localTracks.audio) {
        localTracks.audio.stop();
      }
    };
  }, [
    localTracks.audio,
    audioInputDeviceId,
    isAudioTrackEnabled,
    setIsAudioTrackEnabled,
    setError,
  ]);

  // Video controller
  useEffect(() => {
    if (localTracks.video && !isVideoTrackEnabled) {
      localTracks.video.stop();
      handleTrackUpdate('video', undefined);
      return;
    }

    if (!localTracks.video && isVideoTrackEnabled) {
      getUserMedia({
        video: getVideoConstraints(videoInputDeviceId, optionalFeatures),
      })
        .then((stream) => {
          handleTrackUpdate('video', stream?.getVideoTracks()[0]);
        })
        .catch((error) => {
          if (
            error instanceof DOMException &&
            error.name === 'NotAllowedError'
          ) {
            setIsVideoTrackEnabled(false);
            setError(MediaDeviceErrors.videoBlocked);
          }
        });
    }

    return () => {
      if (localTracks.video) {
        localTracks.video.stop();
      }
    };
  }, [
    localTracks.video,
    videoInputDeviceId,
    isVideoTrackEnabled,
    setIsVideoTrackEnabled,
    optionalFeatures,
    setError,
  ]);

  return localTracks;
}
