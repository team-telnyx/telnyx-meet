import React, { Dispatch, SetStateAction } from 'react';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Text } from 'grommet';
import { FontAwesomeIcon as BaseFontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import {
  saveItem,
  USER_PREFERENCE_AUDIO_ENABLED,
  USER_PREFERENCE_VIDEO_ENABLED,
} from 'utils/storage';

import { getUserMedia, MediaDeviceErrors } from './helper';

const breakpointLarge = 1450;

const FontAwesomeIcon = styled(BaseFontAwesomeIcon)`
  @media (max-width: ${breakpointLarge}px) {
    font-size: 25px;
  }
`;

function MediaControlBar({
  setAudioInputDeviceId,
  audioInputDeviceId,
  setVideoInputDeviceId,
  videoInputDeviceId,
  setError,
  localTracks,
  setLocalTracks,
}: {
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
  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  audioInputDeviceId: string | undefined;
  setVideoInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  videoInputDeviceId: string | undefined;
  setError: Dispatch<
    SetStateAction<{ title: string; body: string } | undefined>
  >;
}) {
  const handleAudioClick = () => {
    if (localTracks?.audio) {
      localTracks.audio.stop();
      setLocalTracks((value) => ({ ...value, audio: undefined }));
      setAudioInputDeviceId(undefined);
      saveItem(USER_PREFERENCE_AUDIO_ENABLED, 'no');
    } else {
      getUserMedia({
        audio: audioInputDeviceId ? { deviceId: audioInputDeviceId } : true,
        video: false,
      })
        .then((stream) => {
          setLocalTracks((value) => ({
            ...value,
            audio: stream?.getAudioTracks()[0],
          }));
          setAudioInputDeviceId(stream?.getAudioTracks()[0].id);
          saveItem(USER_PREFERENCE_AUDIO_ENABLED, 'yes');
        })
        // TODO: avoid disable line
        // eslint-disable-next-line no-unused-vars
        .catch((err) => {
          setError(MediaDeviceErrors.mediaBlocked);
        });
    }
  };

  const handleVideoClick = () => {
    if (localTracks?.video) {
      localTracks.video.stop();
      setLocalTracks((value) => ({ ...value, video: undefined }));
      setVideoInputDeviceId(undefined);
      saveItem(USER_PREFERENCE_VIDEO_ENABLED, 'no');
    } else {
      getUserMedia({
        audio: false,
        video: videoInputDeviceId ? { deviceId: videoInputDeviceId } : true,
      })
        .then((stream) => {
          setLocalTracks((value) => ({
            ...value,
            video: stream?.getVideoTracks()[0],
          }));

          setVideoInputDeviceId(stream?.getVideoTracks()[0].id);
          saveItem(USER_PREFERENCE_VIDEO_ENABLED, 'yes');
        })
        // TODO: avoid disable line
        // eslint-disable-next-line no-unused-vars
        .catch((err) => {
          setError(MediaDeviceErrors.mediaBlocked);
        });
    }
  };

  return (
    <React.Fragment>
      <Button onClick={handleAudioClick} style={{ marginRight: 20 }}>
        <Box align='center' gap='xsmall'>
          <Box>
            <Text
              size='40.3px' // kinda hacky, make fa icon 48px
              color={!localTracks?.audio?.enabled ? 'status-error' : 'accent-1'}
            >
              <FontAwesomeIcon
                icon={
                  !localTracks?.audio?.enabled
                    ? faMicrophoneSlash
                    : faMicrophone
                }
                fixedWidth
              />
            </Text>
          </Box>
          <Text size='xsmall' color='light-6'>
            {!localTracks?.audio?.enabled ? 'Unmute mic' : 'Mute mic'}
          </Text>
        </Box>
      </Button>

      <Button onClick={handleVideoClick}>
        <Box align='center' gap='xsmall'>
          <Box>
            <Text
              size='40.3px' // kinda hacky, make fa icon 48px
              color={!localTracks?.video?.enabled ? 'status-error' : 'accent-1'}
            >
              <FontAwesomeIcon
                icon={!localTracks?.video?.enabled ? faVideoSlash : faVideo}
                fixedWidth
              />
            </Text>
          </Box>
          <Text size='xsmall' color='light-6'>
            {!localTracks?.video?.enabled ? 'Start video' : 'Stop video'}
          </Text>
        </Box>
      </Button>
    </React.Fragment>
  );
}

export { MediaControlBar };
