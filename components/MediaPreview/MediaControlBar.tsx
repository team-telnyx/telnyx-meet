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
  USER_PREFERENCE_AUDIO_ALLOWED,
  USER_PREFERENCE_VIDEO_ALLOWED,
} from 'utils/storage';

import { getUserMedia, MediaDeviceErrors } from './helper';

const breakpointLarge = 1450;

const FontAwesomeIcon = styled(BaseFontAwesomeIcon)`
  @media (max-width: ${breakpointLarge}px) {
    font-size: 25px;
  }
`;

function MediaControlBar({
  audioTrack,
  setAudioTrack,
  setAudioInputDeviceId,
  audioInputDeviceId,
  videoTrack,
  setVideoTrack,
  setVideoInputDeviceId,
  videoInputDeviceId,
  setError,
}: {
  audioTrack: MediaStreamTrack | undefined;
  setAudioTrack: Dispatch<SetStateAction<MediaStreamTrack | undefined>>;
  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  audioInputDeviceId: string | undefined;
  videoTrack: MediaStreamTrack | undefined;
  setVideoTrack: Dispatch<SetStateAction<MediaStreamTrack | undefined>>;
  setVideoInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  videoInputDeviceId: string | undefined;
  setError: Dispatch<
    SetStateAction<{ title: string; body: string } | undefined>
  >;
}) {
  return (
    <React.Fragment>
      <Button
        onClick={() => {
          if (audioTrack) {
            audioTrack.stop();
            setAudioTrack(undefined);
            setAudioInputDeviceId(undefined);
            saveItem(USER_PREFERENCE_AUDIO_ALLOWED, 'no');
          } else {
            getUserMedia({
              audio: audioInputDeviceId
                ? { deviceId: audioInputDeviceId }
                : true,
              video: false,
            })
              .then((stream) => {
                setAudioTrack(stream?.getAudioTracks()[0]);
                setAudioInputDeviceId(stream?.getAudioTracks()[0].id);
                saveItem(USER_PREFERENCE_AUDIO_ALLOWED, 'yes');
              })
              .catch((err) => {
                setError(MediaDeviceErrors.mediaBlocked);
              });
          }
        }}
        style={{ marginRight: 20 }}
      >
        <Box align='center' gap='xsmall'>
          <Box>
            <Text
              size='40.3px' // kinda hacky, make fa icon 48px
              color={!audioTrack?.enabled ? 'status-error' : 'accent-1'}
            >
              <FontAwesomeIcon
                icon={!audioTrack?.enabled ? faMicrophoneSlash : faMicrophone}
                fixedWidth
              />
            </Text>
          </Box>
          <Text size='xsmall' color='light-6'>
            {!audioTrack?.enabled ? 'Unmute mic' : 'Mute mic'}
          </Text>
        </Box>
      </Button>

      <Button
        onClick={() => {
          if (videoTrack) {
            videoTrack.stop();
            setVideoTrack(undefined);
            setVideoInputDeviceId(undefined);
            saveItem(USER_PREFERENCE_VIDEO_ALLOWED, 'no');
          } else {
            getUserMedia({
              audio: false,
              video: videoInputDeviceId
                ? { deviceId: videoInputDeviceId }
                : true,
            })
              .then((stream) => {
                setVideoTrack(stream?.getVideoTracks()[0]);
                setVideoInputDeviceId(stream?.getVideoTracks()[0].id);
                saveItem(USER_PREFERENCE_VIDEO_ALLOWED, 'yes');
              })
              .catch((err) => {
                setError(MediaDeviceErrors.mediaBlocked);
              });
          }
        }}
      >
        <Box align='center' gap='xsmall'>
          <Box>
            <Text
              size='40.3px' // kinda hacky, make fa icon 48px
              color={!videoTrack?.enabled ? 'status-error' : 'accent-1'}
            >
              <FontAwesomeIcon
                icon={!videoTrack?.enabled ? faVideoSlash : faVideo}
                fixedWidth
              />
            </Text>
          </Box>
          <Text size='xsmall' color='light-6'>
            {!videoTrack?.enabled ? 'Start video' : 'Stop video'}
          </Text>
        </Box>
      </Button>
    </React.Fragment>
  );
}

export { MediaControlBar };
