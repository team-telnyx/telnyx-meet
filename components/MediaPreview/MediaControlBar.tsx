import React, { useEffect, Dispatch, SetStateAction } from 'react';
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
  getItem,
  USER_PREFERENCE_AUDIO_ENABLED,
  USER_PREFERENCE_VIDEO_ENABLED,
} from 'utils/storage';

const breakpointLarge = 1450;

const FontAwesomeIcon = styled(BaseFontAwesomeIcon)`
  @media (max-width: ${breakpointLarge}px) {
    font-size: 25px;
  }
`;

function MediaControlBar({
  isAudioTrackEnabled,
  isVideoTrackEnabled,
  setIsAudioTrackEnabled,
  setIsVideoTrackEnabled,
  error,
}: {
  isAudioTrackEnabled: boolean;
  isVideoTrackEnabled: boolean;
  setIsAudioTrackEnabled: Dispatch<SetStateAction<boolean>>;
  setIsVideoTrackEnabled: Dispatch<SetStateAction<boolean>>;
  error: any;
}) {
  const handleAudioClick = (isAudioEnabled: boolean) => {
    setIsAudioTrackEnabled(isAudioEnabled);
    saveItem(USER_PREFERENCE_AUDIO_ENABLED, isAudioEnabled ? 'yes' : 'no');
  };

  const handleVideoClick = (isVideoEnabled: boolean) => {
    setIsVideoTrackEnabled(isVideoEnabled);
    saveItem(USER_PREFERENCE_VIDEO_ENABLED, isVideoEnabled ? 'yes' : 'no');
  };

  useEffect(() => {
    const isAudioEnabled = getItem(USER_PREFERENCE_AUDIO_ENABLED) || null;
    const isVideoEnabled = getItem(USER_PREFERENCE_VIDEO_ENABLED) || null;

    setIsAudioTrackEnabled(
      isAudioEnabled && isAudioEnabled === 'yes' ? true : false
    );
    setIsVideoTrackEnabled(
      isVideoEnabled && isVideoEnabled === 'yes' ? true : false
    );
  }, [setIsAudioTrackEnabled, setIsVideoTrackEnabled]);

  useEffect(() => {
    if (!error) {
      return;
    }

    if (error.type === 'audioBlocked') {
      saveItem(USER_PREFERENCE_AUDIO_ENABLED, 'no');
    }

    if (error.type === 'videoBlocked') {
      saveItem(USER_PREFERENCE_VIDEO_ENABLED, 'no');
    }
  }, [error]);

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
    </React.Fragment>
  );
}

export { MediaControlBar };
