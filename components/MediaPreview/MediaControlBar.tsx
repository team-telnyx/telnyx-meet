import React, {
  useEffect,
  Dispatch,
  SetStateAction,
  useRef,
  ChangeEvent,
} from 'react';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Text } from 'grommet';
import { FontAwesomeIcon as BaseFontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import { VideoProcessor, Camera } from '@telnyx/video-processors';

import { getUserMedia } from 'utils/userMedia';
import {
  saveItem,
  getItem,
  USER_PREFERENCE_AUDIO_ENABLED,
  USER_PREFERENCE_VIDEO_ENABLED,
} from 'utils/storage';

import { MediaDeviceErrors } from './helper';

const breakpointLarge = 1450;

const FontAwesomeIcon = styled(BaseFontAwesomeIcon)`
  @media (max-width: ${breakpointLarge}px) {
    font-size: 25px;
  }
`;

function MediaControlBar({
  audioInputDeviceId,
  videoInputDeviceId,
  isAudioTrackEnabled,
  isVideoTrackEnabled,
  setIsAudioTrackEnabled,
  setIsVideoTrackEnabled,
  optionalFeatures,
  localTracks,
  setLocalTracks,
  setError,
  camera,
}: {
  audioInputDeviceId: string | undefined;
  videoInputDeviceId: string | undefined;
  isAudioTrackEnabled: boolean;
  isVideoTrackEnabled: boolean;
  setIsAudioTrackEnabled: Dispatch<SetStateAction<boolean>>;
  setIsVideoTrackEnabled: Dispatch<SetStateAction<boolean>>;
  optionalFeatures: { [key: string]: boolean };
  localTracks: {
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  };
  setLocalTracks: Dispatch<
    SetStateAction<{
      audio: MediaStreamTrack | undefined;
      video: MediaStreamTrack | undefined;
    }>
  >;
  setError: Dispatch<
    SetStateAction<{ title: string; body: string } | undefined>
  >;
  camera: any;
}) {
  const videoProcessor = useRef<any>(null);

  const handleTrackUpdate = (
    kind: 'audio' | 'video',
    track: MediaStreamTrack | undefined
  ) => {
    if (kind === 'audio') {
      setIsAudioTrackEnabled(track !== undefined ? true : false);
    }

    if (kind === 'video') {
      setIsVideoTrackEnabled(track !== undefined ? true : false);
    }

    setLocalTracks((tracks) => ({ ...tracks, [kind]: track }));
  };

  const handleDeviceError = (kind: 'audio' | 'video') => {
    if (kind === 'audio') {
      saveItem(USER_PREFERENCE_AUDIO_ENABLED, 'no');
    }

    if (kind === 'video') {
      saveItem(USER_PREFERENCE_VIDEO_ENABLED, 'no');
    }

    setError(MediaDeviceErrors.mediaBlocked);
  };

  const handleAudioClick = (isAudioEnabled: boolean) => {
    saveItem(USER_PREFERENCE_AUDIO_ENABLED, isAudioEnabled ? 'yes' : 'no');

    if (localTracks.audio) {
      localTracks.audio.stop();
      handleTrackUpdate('audio', undefined);
    } else {
      getUserMedia({
        kind: 'audio',
        deviceId: audioInputDeviceId,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }
  };

  const handleVideoClick = (isVideoEnabled: boolean) => {
    saveItem(USER_PREFERENCE_VIDEO_ENABLED, isVideoEnabled ? 'yes' : 'no');

    if (localTracks.video) {
      localTracks.video.stop();
      handleTrackUpdate('video', undefined);
    } else {
      getUserMedia({
        kind: 'video',
        deviceId: videoInputDeviceId,
        options: optionalFeatures,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }
  };

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioinput = devices.filter(
        (device) => device.kind === 'audioinput'
      )[0];
      const videoinput = devices.filter(
        (device) => device.kind === 'videoinput'
      )[0];

      if (!audioinput.label && !videoinput.label) {
        setError(MediaDeviceErrors.allowMediaWarning);
      }
    });
  }, [setError]);

  useEffect(() => {
    const isAudioEnabled = getItem(USER_PREFERENCE_AUDIO_ENABLED) || null;
    const isVideoEnabled = getItem(USER_PREFERENCE_VIDEO_ENABLED) || null;

    if (isAudioEnabled === 'yes' || isAudioTrackEnabled) {
      setIsAudioTrackEnabled(true);
      getUserMedia({
        kind: 'audio',
        deviceId: audioInputDeviceId,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }

    if (isVideoEnabled === 'yes' || isVideoTrackEnabled) {
      setIsVideoTrackEnabled(true);
      getUserMedia({
        kind: 'video',
        deviceId: videoInputDeviceId,
        options: optionalFeatures,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }
    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVirtualBg = async (e: ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value || e.target.value === 'none') {
      getUserMedia({
        kind: 'video',
        deviceId: videoInputDeviceId,
        options: optionalFeatures,
        callbacks: {
          onTrackUpdate: async (
            kind: 'audio' | 'video',
            track: MediaStreamTrack | undefined
          ) => {
            await camera.current?.stop();
            if (
              videoProcessor.current &&
              videoProcessor.current?.segmentation
            ) {
              await videoProcessor.current?.stop();
              videoProcessor.current = null;
            }
            camera.current = null;

            if (track && kind === 'video') {
              setLocalTracks((tracks) => ({ ...tracks, [kind]: track }));
            }
          },
          onDeviceError: handleDeviceError,
        },
      });
    }

    getUserMedia({
      kind: 'video',
      deviceId: videoInputDeviceId,
      options: optionalFeatures,
      callbacks: {
        onTrackUpdate: async (
          kind: 'audio' | 'video',
          track: MediaStreamTrack | undefined
        ) => {
          if (e.target.value !== 'blur') {
            // We use this image as our virtual background
            const image = new Image(996, 664);
            image.src = `//localhost:3000/${e.target.value}`;
            if (
              !videoProcessor.current ||
              !videoProcessor.current?.segmentation
            ) {
              videoProcessor.current = new VideoProcessor();
            }

            if (camera.current) {
              await camera.current?.stop();
            }

            const {
              videoCameraProcessor,
              canvasStream,
            }: { videoCameraProcessor: Camera; canvasStream: MediaStream } =
              await videoProcessor.current.createVirtualBackgroundStream({
                track,
                videoElementId: 'video-preview',
                canvasElementId: 'canvas',
                image,
                frameRate: 20,
              });

            videoCameraProcessor.start();
            camera.current = videoCameraProcessor;

            setLocalTracks((value) => ({
              ...value,
              video: canvasStream.getVideoTracks()[0],
            }));
          } else {
            if (
              !videoProcessor.current ||
              !videoProcessor.current?.segmentation
            ) {
              videoProcessor.current = new VideoProcessor();
            }

            if (camera.current) {
              await camera.current?.stop();
            }

            const {
              videoCameraProcessor,
              canvasStream,
            }: { videoCameraProcessor: Camera; canvasStream: MediaStream } =
              await videoProcessor.current.createGaussianBlurBackgroundStream({
                track,
                videoElementId: 'video-preview',
                frameRate: 20,
                canvasElementId: 'canvas',
              });

            videoCameraProcessor.start();
            camera.current = videoCameraProcessor;

            setLocalTracks((value) => ({
              ...value,
              video: canvasStream.getVideoTracks()[0],
            }));
          }
        },
        onDeviceError: handleDeviceError,
      },
    });
  };

  const renderSelectBackgroungImage = () => {
    const options = ['retro.webp', 'mansao.webp', 'paradise.jpg'].map(
      (item, index) => {
        return (
          <option key={index} value={item}>
            {item}
          </option>
        );
      }
    );
    return (
      <select
        disabled={!isVideoTrackEnabled}
        name={'images'}
        onChange={handleVirtualBg}
      >
        <option value={'none'}>none</option>
        <option value={'blur'}>blur</option>
        {options}
      </select>
    );
  };

  return (
    <React.Fragment>
      <Button
        onClick={() => handleAudioClick(!isAudioTrackEnabled)}
        style={{ marginRight: 20 }}
      >
        <Box align='center' gap='xsmall'>
          <Box>
            <Text
              size='40.3px' // kinda hacky, make fa icon 48px
              color={isAudioTrackEnabled ? 'accent-1' : 'status-error'}
            >
              <FontAwesomeIcon
                icon={isAudioTrackEnabled ? faMicrophone : faMicrophoneSlash}
                fixedWidth
              />
            </Text>
          </Box>
          <Text size='xsmall' color='light-6'>
            {isAudioTrackEnabled ? 'Mute mic' : 'Unmute mic'}
          </Text>
        </Box>
      </Button>

      <Button onClick={() => handleVideoClick(!isVideoTrackEnabled)}>
        <Box align='center' gap='xsmall'>
          <Box>
            <Text
              size='40.3px' // kinda hacky, make fa icon 48px
              color={isVideoTrackEnabled ? 'accent-1' : 'status-error'}
            >
              <FontAwesomeIcon
                icon={isVideoTrackEnabled ? faVideo : faVideoSlash}
                fixedWidth
              />
            </Text>
          </Box>
          <Text size='xsmall' color='light-6'>
            {isVideoTrackEnabled ? 'Stop video' : 'Start video'}
          </Text>
        </Box>
      </Button>
      {renderSelectBackgroungImage()}
    </React.Fragment>
  );
}

export { MediaControlBar };
