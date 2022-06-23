import {
  useState,
  useEffect,
  useContext,
  useRef,
  ChangeEvent,
  MutableRefObject,
} from 'react';
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

import ErrorDialog from 'components/ErrorDialog';

import { Chat } from './Chat';

import { getUserMedia } from 'utils/userMedia';
import {
  getItemSessionStorage,
  saveItemSessionStorage,
  USER_PREFERENCE_BACKGROUND_TYPE,
} from 'utils/storage';
import {
  addVirtualBackgroundStream,
  VirtualBackground,
} from 'utils/virtualBackground';
import { MenuList } from './MenuList';

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

const Bubble = styled.div`
  background-color: #8ab4f8;
  border-color: #202124;
  right: -3px;
  position: absolute;
  top: -4px;
  border-radius: 50%;
  border: 2px solid white;
  height: 18px;
  width: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const isSinkIdSupported = (): boolean => {
  const audio = document.createElement('audio');
  // @ts-expect-error
  return typeof audio?.setSinkId === 'function';
};

function DeviceSelect({
  kind,
  devices = [],
  selectedDeviceId,
  handleDeviceChange,
}: {
  kind: 'audio_input' | 'video_input' | 'audio_output';
  devices: Array<{ id: string; label: string }>;
  selectedDeviceId?: string;
  handleDeviceChange: (
    kind: 'audio_input' | 'video_input' | 'audio_output',
    deviceId: string
  ) => void;
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
        onClick: () => handleDeviceChange(kind, device.id),
      }))}
      disabled={devices.length < 2}
      icon={false}
    ></Menu>
  );
}

export default function RoomControls({
  isParticipantsListVisible,
  isInviteParticipantVisible,
  useMixedAudioForOutput,
  setIsParticipantsListVisible,
  setIsInviteParticipantVisible,
  setUseMixedAudioForOutput,
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
  camera,
}: {
  isParticipantsListVisible: boolean;
  isInviteParticipantVisible: boolean;
  useMixedAudioForOutput: boolean;
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  addStream: TelnyxRoom['addStream'];
  removeStream: TelnyxRoom['removeStream'];
  updateStream: TelnyxRoom['updateStream'];
  disconnect: TelnyxRoom['disconnect'];
  setIsParticipantsListVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInviteParticipantVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setUseMixedAudioForOutput: React.Dispatch<React.SetStateAction<boolean>>;
  streams: { [key: string]: Stream };
  disableScreenshare: boolean;
  sendMessage: Room['sendMessage'];
  messages: TelnyxRoom['messages'];
  getLocalParticipant: () => Participant;
  camera: MutableRefObject<any>;
}) {
  const {
    audioInputDeviceId,
    audioOutputDeviceId,
    videoInputDeviceId,
    setAudioInputDeviceId,
    setAudioOutputDeviceId,
    setVideoInputDeviceId,
    unreadMessages,
    isAudioTrackEnabled,
    isVideoTrackEnabled,
    setIsAudioTrackEnabled,
    setIsVideoTrackEnabled,
    optionalFeatures,
    isVideoPlaying,
  } = useContext(TelnyxMeetContext);

  const videoProcessor = useRef<VirtualBackground['videoProcessor']>(null);

  const [virtualBackgroundType, setVirtualBackgroundType] = useState<
    string | undefined
  >();

  const [devices, setDevices] = useState<any>({});
  const [localTracks, setLocalTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });
  const [presentationTracks, setPresentationTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });
  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

  const [showChatBox, setShowChatBox] = useState(false);

  const selfStream = streams.self;
  const presentationStream = streams.presentation;
  const participantCount = participantsByActivity.size;
  const localParticipant = getLocalParticipant();

  const context = localParticipant.context
    ? JSON.parse(localParticipant.context)
    : undefined;

  const VIDEO_ELEMENT_ID = `video-feed-${context.username
    ?.toLowerCase()
    .replace(' ', '-')}`;

  const handleVirtualBg = async (selectedValue: string) => {
    saveItemSessionStorage(USER_PREFERENCE_BACKGROUND_TYPE, selectedValue);
    setVirtualBackgroundType(selectedValue);
    getUserMedia({
      kind: 'video',
      deviceId: videoInputDeviceId,
      callbacks: {
        onTrackUpdate: async (
          kind: 'audio' | 'video',
          track: MediaStreamTrack | undefined
        ) => {
          if (kind === 'video' && track) {
            const videoTrack = await addVirtualBackgroundStream({
              videoProcessor: videoProcessor,
              camera: camera,
              videoElementId: VIDEO_ELEMENT_ID,
              canvasElementId: 'canvas',
              track: track,
              backgroundValue: selectedValue,
            });

            setVideoInputDeviceId(track.id);

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
          initialValue={backgroundValue}
          title='Change background'
          data={options}
          onChange={(item) => handleVirtualBg(item.value)}
        ></MenuList>
      </span>
    );
  };

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

  const handleDeviceError = (kind: 'audio' | 'video' | 'screenshare') => {
    if (kind === 'audio') {
      setError({
        title: 'Microphone unavailable',
        body: 'Please check browser media permission settings.',
      });
    }

    if (kind === 'video') {
      setError({
        title: 'Camera unavailable',
        body: 'Please check browser media permission settings.',
      });
    }

    if (kind === 'screenshare') {
      setError({
        title: 'Screen share unavailable',
        body: 'Failed to share your screen.',
      });
    }
  };

  const handleAudioClick = () => {
    if (localTracks.audio) {
      localTracks.audio.stop();
      if (selfStream.audioTrack) {
        selfStream.audioTrack.stop();
      }
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

  const handleVideoClick = () => {
    if (localTracks.video) {
      localTracks.video.stop();
      if (selfStream.videoTrack) {
        selfStream.videoTrack.stop();
      }

      if (camera && camera.current) {
        camera.current?.stop();
        camera.current = null;
      }

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

  const handleDeviceChange = (
    kind: 'audio_input' | 'video_input' | 'audio_output',
    deviceId: string
  ) => {
    console.debug('[video-meet] Device changed: ', kind, ' id: ', deviceId);

    if (kind === 'audio_input') {
      setAudioInputDeviceId(deviceId);

      if (localTracks.audio) {
        localTracks.audio.stop();
        getUserMedia({
          kind: 'audio',
          deviceId: deviceId,
          callbacks: {
            onTrackUpdate: handleTrackUpdate,
            onDeviceError: handleDeviceError,
          },
        });
      }
    }

    if (kind === 'video_input') {
      setVideoInputDeviceId(deviceId);

      if (localTracks.video) {
        localTracks.video.stop();
        getUserMedia({
          kind: 'video',
          deviceId: deviceId,
          options: optionalFeatures,
          callbacks: {
            onTrackUpdate: handleTrackUpdate,
            onDeviceError: handleDeviceError,
          },
        });
      }
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

  const handleLeaveRoom = () => {
    localTracks?.audio?.stop();
    localTracks?.video?.stop();
    presentationTracks?.audio?.stop();
    presentationTracks?.video?.stop();
    disconnect();
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
    };
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
            options: { enableSimulcast: optionalFeatures.isSimulcastEnabled },
          },
        });
      }

      presentationTracks.video.onended = () => {
        removeStream('presentation');
        setPresentationTracks({ audio: undefined, video: undefined });
      };
    }
    // TODO: avoid disable line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationStream, presentationTracks]);

  useEffect(() => {
    if (isAudioTrackEnabled) {
      getUserMedia({
        kind: 'audio',
        deviceId: audioInputDeviceId,
        callbacks: {
          onTrackUpdate: handleTrackUpdate,
          onDeviceError: handleDeviceError,
        },
      });
    }

    if (isVideoTrackEnabled) {
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

  useEffect(() => {
    if (
      isVideoPlaying &&
      optionalFeatures &&
      optionalFeatures.isVirtualBackgroundFeatureEnabled
    ) {
      const videoElement = document.getElementById(VIDEO_ELEMENT_ID);
      if (videoElement) {
        getUserMedia({
          kind: 'video',
          deviceId: undefined,
          options: optionalFeatures,
          callbacks: {
            onTrackUpdate: (
              kind: 'audio' | 'video',
              track: MediaStreamTrack | undefined
            ) => {
              const backgroundValue = getItemSessionStorage(
                USER_PREFERENCE_BACKGROUND_TYPE
              );
              if (backgroundValue) {
                if (kind === 'video' && track) {
                  addVirtualBackgroundStream({
                    videoProcessor: videoProcessor,
                    camera: camera,
                    videoElementId: VIDEO_ELEMENT_ID,
                    canvasElementId: 'canvas',
                    track: track,
                    backgroundValue: backgroundValue,
                  }).then((videoTrack) => {
                    setVideoInputDeviceId(track.id);
                    setLocalTracks((value) => ({
                      ...value,
                      video:
                        !backgroundValue || backgroundValue === 'none'
                          ? track
                          : videoTrack,
                    }));
                    setVirtualBackgroundType(backgroundValue);
                  });
                }
              }
            },
            onDeviceError: handleDeviceError,
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoPlaying]);

  const hasUnreadMessages = () => {
    if (unreadMessages.current && unreadMessages.current.length > 0) {
      return true;
    }
    return false;
  };

  const checkBubbleNotification = () => {
    if (messages && messages.length > 0) {
      const lastMessage = messages.length - 1;
      const isNotLocalParticipantMessage =
        messages[lastMessage].from !== localParticipant.id;
      const existUnreadMessages = hasUnreadMessages();

      if (isNotLocalParticipantMessage && !showChatBox && existUnreadMessages) {
        return true;
      }
    }
    return false;
  };

  const getTotalUnreadMessages = () => {
    if (!unreadMessages || !unreadMessages.current) {
      return 1;
    }
    return unreadMessages.current.length;
  };

  const showBubbleNotification = checkBubbleNotification();

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
          onClose={() => {
            setShowChatBox(false);
            unreadMessages.current = [];
          }}
          localParticipant={localParticipant}
        ></Chat>
      )}

      <Box pad='small' direction='row' gap='medium'>
        <Box width='80px'>
          <Button
            data-testid='btn-toggle-audio'
            size='large'
            onClick={handleAudioClick}
            disabled={!selfStream?.isConfigured}
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    selfStream?.isAudioEnabled ? 'accent-1' : 'status-error'
                  }
                >
                  <FontAwesomeIconStyled
                    icon={
                      selfStream?.isAudioEnabled
                        ? faMicrophone
                        : faMicrophoneSlash
                    }
                    fixedWidth
                  />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {selfStream?.isAudioEnabled ? 'Mute mic' : 'Unmute mic'}
              </Text>
            </Box>
          </Button>
        </Box>

        <Box width='80px'>
          <Button
            data-testid='btn-toggle-video'
            size='large'
            onClick={handleVideoClick}
            disabled={!selfStream?.isConfigured}
            data-e2e='toggle video'
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    selfStream?.isVideoEnabled ? 'accent-1' : 'status-error'
                  }
                >
                  <FontAwesomeIconStyled
                    icon={selfStream?.isVideoEnabled ? faVideo : faVideoSlash}
                    fixedWidth
                  />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {selfStream?.isVideoEnabled ? 'Stop video' : 'Start video'}
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
                if (presentationStream) {
                  removeStream('presentation');
                }
                setPresentationTracks({ audio: undefined, video: undefined });
              } else {
                navigator?.mediaDevices
                  ?.getDisplayMedia({ audio: true, video: true })
                  .then((stream) => {
                    setPresentationTracks({
                      audio: stream?.getAudioTracks()[0],
                      video: stream?.getVideoTracks()[0],
                    });
                  })
                  .catch((error) => {
                    if (
                      error instanceof DOMException &&
                      error.name === 'NotAllowedError'
                    ) {
                      handleDeviceError('screenshare');
                    }
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
                unreadMessages.current = [];
              }}
            >
              <Box align='center' gap='xsmall'>
                <Box style={{ position: 'relative' }}>
                  {showBubbleNotification && (
                    <Bubble>
                      <span
                        style={{
                          fontSize: '10px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        {getTotalUnreadMessages()}
                      </span>
                    </Bubble>
                  )}
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
        {optionalFeatures &&
          optionalFeatures.isVirtualBackgroundFeatureEnabled &&
          renderSelectBackgroungImage()}
        <Box>
          <Button
            onClick={() => {
              setUseMixedAudioForOutput(!useMixedAudioForOutput);
            }}
          >
            <Text>{`Toggle Mixed Audio: ${
              useMixedAudioForOutput ? 'On' : 'Off'
            }`}</Text>
          </Button>
        </Box>

        <DeviceSelect
          kind='audio_input'
          devices={devices?.audioinput}
          selectedDeviceId={audioInputDeviceId}
          handleDeviceChange={handleDeviceChange}
        />

        <DeviceSelect
          kind='video_input'
          devices={devices?.videoinput}
          selectedDeviceId={videoInputDeviceId}
          handleDeviceChange={handleDeviceChange}
        />

        {isSinkIdSupported() && (
          <DeviceSelect
            kind='audio_output'
            devices={devices?.audiooutput}
            selectedDeviceId={audioOutputDeviceId}
            handleDeviceChange={handleDeviceChange}
          />
        )}

        <Box>
          <Button
            data-testid='btn-leave-room'
            label='Leave'
            onClick={handleLeaveRoom}
            color='status-error'
          />
        </Box>
      </RightBoxMenu>

      <LeaveButton
        data-testid='btn-leave-room'
        label='Leave'
        onClick={handleLeaveRoom}
        color='status-error'
      />
    </Box>
  );
}
