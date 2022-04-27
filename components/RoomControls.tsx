import { useContext, useEffect, useState } from 'react';
import { getDevices, Participant, Room, Stream } from '@telnyx/video';
import { Box, Button, Menu, Text } from 'grommet';
import {
  Group as GroupIcon,
  Chat as ChatIcon,
  UserAdd as InviteIcon,
} from 'grommet-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faLaptop,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';
import { TelnyxRoom } from 'hooks/room';
import { useMediaController } from 'hooks/mediaController';

import ErrorDialog from 'components/ErrorDialog';

import { Chat } from './Chat';

const breakpointMedium = 1023;

const RightBoxMenu = styled(Box)`
  @media (max-width: ${breakpointMedium}px) {
    display: none;
  }
  align-items: center;
  justify-content: center;
`;

const ControllerBox = styled(Box)`
  @media (max-width: ${breakpointMedium}px) {
    display: none;
  }
`;

const LeaveButton = styled(Button)`
  @media (min-width: ${breakpointMedium}px) {
    display: none;
  }
  margin-right: 6px;
`;

const FontAwesomeIconStyled = styled(FontAwesomeIcon)`
  @media (max-width: ${breakpointMedium}px) {
    font-size: 25px;
  }
`;

const isSinkIdSupported = (): boolean => {
  const audio = document.createElement('audio');
  // @ts-expect-error
  return typeof audio?.setSinkId === 'function';
};

const getDisplayMedia = async (): Promise<MediaStream> => {
  // @ts-ignore
  return navigator?.mediaDevices?.getDisplayMedia({ audio: true, video: true });
};

function DeviceSelect({
  kind,
  devices = [],
  selectedDeviceId,
  onSelectDevice,
}: {
  kind: 'audio_input' | 'video_input' | 'audio_output';
  devices: Array<{ id: string; label: string }>;
  selectedDeviceId?: string;
  onSelectDevice: Function;
}) {
  const currentDeviceId = selectedDeviceId;

  let label = '';
  switch (kind) {
    case 'audio_input':
      label = 'mic';
      break;
    case 'audio_output':
      label = 'output';
      break;
    case 'video_input':
      label = 'camera';
      break;
    default:
      throw new Error('Unknown device type!');
  }

  return (
    <Menu
      label={`Change ${label}`}
      items={devices.map((device) => ({
        label: device.label,
        icon: (
          <Box>
            {device.id === currentDeviceId && (
              <Text color='accent-1'>
                <FontAwesomeIconStyled icon={faCheck} fixedWidth />
              </Text>
            )}
          </Box>
        ),
        gap: 'small', // gap between icon and text
        reverse: true, // icon on right
        // TODO give some sort UI feedback that device was successfully changed
        onClick: () => onSelectDevice({ kind: kind, deviceId: device.id }),
      }))}
      disabled={devices.length < 2}
      icon={false}
    ></Menu>
  );
}

export default function RoomControls({
  isParticipantsListVisible,
  isInviteParticipantVisible,
  setIsParticipantsListVisible,
  setIsInviteParticipantVisible,
  streams,
  disableScreenshare,
  participantsByActivity,
  addStream,
  removeStream,
  updateStream,
  disconnect,
  sendMessage,
  messages,
  getLocalParticipant,
}: {
  isParticipantsListVisible: boolean;
  isInviteParticipantVisible: boolean;
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  addStream: TelnyxRoom['addStream'];
  removeStream: TelnyxRoom['removeStream'];
  updateStream: TelnyxRoom['updateStream'];
  disconnect: TelnyxRoom['disconnect'];
  setIsParticipantsListVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInviteParticipantVisible: React.Dispatch<React.SetStateAction<boolean>>;
  streams: { [key: string]: Stream };
  disableScreenshare: boolean;
  sendMessage: Room['sendMessage'];
  messages: TelnyxRoom['messages'];
  getLocalParticipant: () => Participant;
}) {
  const {
    audioInputDeviceId,
    audioOutputDeviceId,
    videoInputDeviceId,
    setAudioInputDeviceId,
    setAudioOutputDeviceId,
    setVideoInputDeviceId,
    isAudioTrackEnabled,
    isVideoTrackEnabled,
    setIsAudioTrackEnabled,
    setIsVideoTrackEnabled,
    optionalFeatures,
    error,
    setError,
  } = useContext(TelnyxMeetContext);

  const localTracks = useMediaController();

  const [devices, setDevices] = useState<any>({});
  const [showChatBox, setShowChatBox] = useState(false);
  const [presentationTracks, setPresentationTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });

  const selfStream = streams.self;
  const presentationStream = streams.presentation;
  const participantCount = participantsByActivity.size;
  const localParticipant = getLocalParticipant();

  const handleMediaError = (
    error: Error,
    kind: 'audio' | 'video' | 'screenshare'
  ) => {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      if (kind === 'audio') {
        setError({
          type: 'audioUnavailable',
          message: {
            title: 'Microphone unavailable',
            body: 'Please check browser media permission settings.',
          },
        });
      }
    }

    if (kind === 'video') {
      setError({
        type: 'cameraUnavailable',
        message: {
          title: 'Camera unavailable',
          body: 'Please check browser media permission settings.',
        },
      });
    }

    if (kind === 'screenshare') {
      setError({
        type: 'screenShareUnavailable',
        message: {
          title: 'Screen share unavailable',
          body: 'Failed to share your screen.',
        },
      });
    }
  };

  const onDeviceChange = ({
    kind,
    deviceId,
  }: {
    kind: 'audio_input' | 'video_input' | 'audio_output';
    deviceId: string;
  }) => {
    console.log('[video-meet] onDeviceChange: ', kind, ' id: ', deviceId);

    if (kind === 'audio_input') {
      setAudioInputDeviceId(deviceId);
      // TODO: handle error inside room 
      // .catch((err) => {
      //   handleMediaError(err, 'audio');
      // });
    }

    if (kind === 'video_input') {
      setVideoInputDeviceId(deviceId);
      // TODO: handle error inside room 
      // .catch((err) => {
      //   handleMediaError(err, 'video');
      // });
    }

    if (kind === 'audio_output') {
      setAudioOutputDeviceId(deviceId);
    }
  };

  const getAndSetDevices = () => {
    getDevices()
      .then(setDevices)
      .catch(() => {
        setDevices({});
      });
  };

  useEffect(() => {
    // get devices if permissions are already granted
    getAndSetDevices();
    navigator?.mediaDevices?.addEventListener('devicechange', getAndSetDevices);

    return () => {
      navigator?.mediaDevices?.removeEventListener(
        'devicechange',
        getAndSetDevices
      );
      presentationTracks?.audio?.stop();
      presentationTracks?.video?.stop();
    };
    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selfStream) {
      addStream('self', {
        audio: localTracks.audio,
        video: {
          track: localTracks.video,
          options: { enableSimulcast: optionalFeatures.isSimulcastEnabled },
        },
      });

      return;
    }

    if (
      selfStream.isConfigured &&
      (selfStream.audioTrack !== localTracks.audio ||
        selfStream.videoTrack !== localTracks.video)
    ) {
      updateStream('self', localTracks);
    }
    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfStream, localTracks]);

  useEffect(() => {
    if (presentationTracks.video) {
      if (!presentationStream) {
        addStream('presentation', {
          audio: presentationTracks.audio,
          video: {
            track: presentationTracks.video,
            options: {
              enableSimulcast: optionalFeatures.isSimulcastEnabled,
            },
          },
        });
      } else {
        updateStream('presentation', presentationTracks);
      }

      presentationTracks.video.onended = () => {
        removeStream('presentation');
      };
    } else {
      if (presentationStream) {
        removeStream('presentation');
      }
    }
    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationStream, presentationTracks]);

  return (
    <Box
      gridArea='controls'
      direction='row'
      align='center'
      justify='between'
      style={{
        zIndex: 2,
        backgroundColor: '#000',
      }}
    >
      {error && (
        <ErrorDialog onClose={() => setError(undefined)} error={error} />
      )}

      {showChatBox && (
        <Chat
          sendMessage={sendMessage}
          messages={messages}
          onClose={() => setShowChatBox(false)}
          localParticipant={localParticipant}
        ></Chat>
      )}

      <Box pad='small' direction='row' gap='medium'>
        <Box width='80px'>
          <Button
            data-testid='btn-toggle-audio'
            size='large'
            onClick={() => {
              if (isAudioTrackEnabled) {
                setIsAudioTrackEnabled(false);
                if (selfStream?.audioTrack) {
                  selfStream?.audioTrack.stop();
                }
              } else {
                setIsAudioTrackEnabled(true);
                // TODO: handle error inside room 
                // .catch((err) => {
                //   handleMediaError(err, 'audio');
                // });
              }
            }}
            disabled={!selfStream?.isConfigured}
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    !selfStream?.isAudioEnabled ? 'status-error' : 'accent-1'
                  }
                >
                  <FontAwesomeIconStyled
                    icon={
                      !selfStream?.isAudioEnabled
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    fixedWidth
                  />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {!selfStream?.isAudioEnabled ? 'Unmute mic' : 'Mute mic'}
              </Text>
            </Box>
          </Button>
        </Box>

        <Box width='80px'>
          <Button
            data-testid='btn-toggle-video'
            size='large'
            onClick={() => {
              if (isVideoTrackEnabled) {
                setIsVideoTrackEnabled(false);
                if (selfStream?.videoTrack) {
                  selfStream?.videoTrack.stop();
                }
              } else {
                setIsVideoTrackEnabled(true);
                // TODO: handle error inside room 
                // .catch((err) => {
                //   handleMediaError(err, 'video');
                // });
              }
            }}
            disabled={!selfStream?.isConfigured}
            data-e2e='toggle video'
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    !selfStream?.isVideoEnabled ? 'status-error' : 'accent-1'
                  }
                >
                  <FontAwesomeIconStyled
                    icon={!selfStream?.isVideoEnabled ? faVideoSlash : faVideo}
                    fixedWidth
                  />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {!selfStream?.isVideoEnabled ? 'Start video' : 'Stop video'}
              </Text>
            </Box>
          </Button>
        </Box>

        <ControllerBox width='80px'>
          <Button
            data-testid='btn-toggle-screen-sharing'
            size='large'
            disabled={disableScreenshare}
            onClick={() => {
              if (presentationTracks.audio || presentationTracks.video) {
                presentationTracks.audio?.stop();
                presentationTracks.video?.stop();

                setPresentationTracks({ audio: undefined, video: undefined });
              } else {
                getDisplayMedia()
                  .then((stream) => {
                    setPresentationTracks({
                      audio: stream?.getAudioTracks()[0],
                      video: stream?.getVideoTracks()[0],
                    });
                  })
                  .catch((error) => {
                    handleMediaError(error, 'screenshare');
                  });
              }
            }}
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    presentationStream?.isVideoEnabled
                      ? 'accent-1'
                      : 'status-error'
                  }
                >
                  <FontAwesomeIconStyled icon={faLaptop} fixedWidth />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {presentationStream?.isVideoEnabled
                  ? 'Stop share'
                  : 'Start share'}
              </Text>
            </Box>
          </Button>
        </ControllerBox>

        <ControllerBox width='80px'>
          <Button
            data-testid='btn-toggle-participant-list'
            size='large'
            onClick={() => {
              if (isInviteParticipantVisible) {
                setIsInviteParticipantVisible(false);
              }
              setIsParticipantsListVisible(!isParticipantsListVisible);
            }}
          >
            <Box align='center' gap='xsmall'>
              <Box style={{ position: 'relative' }}>
                <GroupIcon
                  size='large'
                  color={isParticipantsListVisible ? 'accent-1' : 'light-5'}
                />
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    transform: 'translateX(100%)',
                  }}
                >
                  <Text color='accent-1'>{participantCount}</Text>
                </Box>
              </Box>
              <Text size='xsmall' color='light-6'>
                Participants
              </Text>
            </Box>
          </Button>
        </ControllerBox>

        {optionalFeatures.isDialOutEnabled && (
          <ControllerBox width='80px'>
            <Button
              data-testid='btn-invite-participant'
              size='large'
              onClick={() => {
                if (isParticipantsListVisible) {
                  setIsParticipantsListVisible(false);
                }
                setIsInviteParticipantVisible(!isInviteParticipantVisible);
              }}
            >
              <Box align='center' gap='xsmall'>
                <InviteIcon
                  size='large'
                  color={isInviteParticipantVisible ? 'accent-1' : 'light-5'}
                />
                <Text size='xsmall' color='light-6'>
                  Invite
                </Text>
              </Box>
            </Button>
          </ControllerBox>
        )}

        {localParticipant.canReceiveMessages && (
          <ControllerBox>
            <Button
              data-testid='btn-toggle-chat'
              size='large'
              onClick={() => {
                setShowChatBox((value) => !value);
              }}
            >
              <Box align='center' gap='xsmall'>
                <Box style={{ position: 'relative' }}>
                  <ChatIcon
                    size='large'
                    color={showChatBox ? 'accent-1' : 'light-5'}
                  />
                </Box>
                <Text size='xsmall' color='light-6'>
                  Chat
                </Text>
              </Box>
            </Button>
          </ControllerBox>
        )}
      </Box>

      <RightBoxMenu pad='small' direction='row' gap='large'>
        <DeviceSelect
          kind='audio_input'
          devices={devices?.audioinput}
          selectedDeviceId={audioInputDeviceId}
          onSelectDevice={onDeviceChange}
        />

        <DeviceSelect
          kind='video_input'
          devices={devices?.videoinput}
          selectedDeviceId={videoInputDeviceId}
          onSelectDevice={onDeviceChange}
        />

        {isSinkIdSupported() && (
          <DeviceSelect
            kind='audio_output'
            devices={devices?.audiooutput}
            selectedDeviceId={audioOutputDeviceId}
            onSelectDevice={onDeviceChange}
          />
        )}
        <Box>
          <Button
            data-testid='btn-leave-room'
            label='Leave'
            onClick={() => disconnect()}
            color='status-error'
          />
        </Box>
      </RightBoxMenu>

      <LeaveButton
        data-testid='btn-leave-room'
        label='Leave'
        onClick={() => disconnect()}
        color='status-error'
      />
    </Box>
  );
}
