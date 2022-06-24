import React, {
  useEffect,
  Dispatch,
  SetStateAction,
  useRef,
  ChangeEvent,
  useState,
} from 'react';
import { useRouter } from 'next/router';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Text } from 'grommet';
import { FontAwesomeIcon as BaseFontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { getUserMedia } from 'utils/userMedia';
import {
  saveItem,
  getItem,
  USER_PREFERENCE_AUDIO_ENABLED,
  USER_PREFERENCE_VIDEO_ENABLED,
  USER_PREFERENCE_BACKGROUND_TYPE,
  saveItemSessionStorage,
  getItemSessionStorage,
} from 'utils/storage';

import { MediaDeviceErrors } from './helper';
import {
  addVirtualBackgroundStream,
  VirtualBackground,
} from 'utils/virtualBackground';
import { MenuList } from 'components/MenuList';

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
  camera: VirtualBackground['camera'];
}) {
  //https://github.com/DefinitelyTyped/DefinitelyTyped/issues/28884#issuecomment-471341041
  const videoProcessor = useRef() as VirtualBackground['videoProcessor'];

  const [virtualBackgroundType, setVirtualBackgroundType] = useState<
    string | undefined
  >();
  const router = useRouter();

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
    if (!router.isReady) {
      return;
    }

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
  }, [router.isReady]);

  useEffect(() => {
    saveItemSessionStorage(USER_PREFERENCE_BACKGROUND_TYPE, 'none');
  }, []);

  const handleVirtualBg = async (selectedValue: string) => {
    saveItemSessionStorage(USER_PREFERENCE_BACKGROUND_TYPE, selectedValue);
    setVirtualBackgroundType(selectedValue);
    getUserMedia({
      kind: 'video',
      deviceId: videoInputDeviceId,
      options: optionalFeatures,
      callbacks: {
        onTrackUpdate: async (
          kind: 'audio' | 'video',
          track: MediaStreamTrack | undefined
        ) => {
          if (kind === 'video' && track) {
            const stream = new MediaStream();
            stream.addTrack(track);
            const videoTrack = await addVirtualBackgroundStream({
              videoProcessor: videoProcessor,
              camera: camera,
              videoElementId: 'video-preview',
              canvasElementId: 'canvas',
              stream,
              backgroundValue: selectedValue,
            });

            setLocalTracks((value) => ({
              ...value,
              video:
                !selectedValue || selectedValue === 'none' ? track : videoTrack,
            }));
          }
        },
        onDeviceError: handleDeviceError,
      },
    });
  };

  const renderSelectBackgroungImage = () => {
    const backgroundValue = getItemSessionStorage(
      USER_PREFERENCE_BACKGROUND_TYPE
    );

    const options = [
      {
        label: 'none',
        value: 'none',
      },
      {
        label: 'blur',
        value: 'blur',
      },
      {
        label: 'retro',
        value: 'retro.webp',
      },
      {
        label: 'mansao',
        value: 'mansao.webp',
      },
      {
        label: 'paradise',
        value: 'paradise.jpg',
      },
    ];

    return (
      <span style={{ color: '#fff' }}>
        <MenuList
          disabled={!isVideoTrackEnabled}
          initialValue={backgroundValue}
          size='small'
          title='Change background'
          data={options}
          onChange={(item) => handleVirtualBg(item.value)}
        ></MenuList>
      </span>
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
      {optionalFeatures &&
        optionalFeatures.isVirtualBackgroundFeatureEnabled &&
        renderSelectBackgroungImage()}
    </React.Fragment>
  );
}

export { MediaControlBar };
