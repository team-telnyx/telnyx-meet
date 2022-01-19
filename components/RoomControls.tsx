import { useContext, useEffect, useState } from 'react';
import { getDevices, Stream } from '@telnyx/video';
import { Box, Button, Menu, Text } from 'grommet';
import { Group as GroupIcon } from 'grommet-icons';
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

import { TelnyxRoom } from 'hooks/room';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';
import ErrorDialog from 'components/ErrorDialog';

const breakpointMedium = 1023;

const RightBoxMenu = styled(Box)`
  @media (max-width: ${breakpointMedium}px) {
    display: none;
  }
  align-items: center;
  justify-content: center;
`;

const ScreenShareBox = styled(Box)`
  @media (max-width: ${breakpointMedium}px) {
    display: none;
  }
`;

const ParticipantBox = styled(Box)`
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

const getUserMedia = async (
  constraints: MediaStreamConstraints
): Promise<MediaStream> => {
  // @ts-ignore
  return navigator?.mediaDevices?.getUserMedia(constraints);
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
  onChangeParticipantsListVisible,
  streams,
  disableScreenshare,
  onAudioOutputDeviceChange,
  participantsByActivity,
  addStream,
  removeStream,
  updateStream,
  disconnect,
}: {
  isParticipantsListVisible: boolean;
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  addStream: TelnyxRoom['addStream'];
  removeStream: TelnyxRoom['removeStream'];
  updateStream: TelnyxRoom['updateStream'];
  disconnect: TelnyxRoom['disconnect'];
  onChangeParticipantsListVisible: Function;
  streams: { [key: string]: Stream };
  disableScreenshare: boolean;
  onAudioOutputDeviceChange: (deviceId?: MediaDeviceInfo['deviceId']) => void;
}) {
  const {
    audioInputDeviceId,
    audioOutputDeviceId,
    videoInputDeviceId,
    setAudioInputDeviceId,
    setAudioOutputDeviceId,
    setVideoInputDeviceId,
    localTracks,
    setLocalTracks,
  } = useContext(TelnyxMeetContext);

  const [devices, setDevices] = useState<any>({});
  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);
  
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

  const getAndSetDevices = () => {
    getDevices()
      .then(setDevices)
      .catch(() => {
        setDevices({});
      });
  };

  const onClose = () => {
    setError(undefined);
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
      removeMediaTracks();
    };
  }, []);

  useEffect(() => {
    if (!selfStream) {
      addStream('self', localTracks);

      return;
    }

    if (
      selfStream.isConfigured &&
      (selfStream.audioTrack !== localTracks.audio ||
        selfStream.videoTrack !== localTracks.video)
    ) {
      updateStream('self', localTracks);
    }
  }, [selfStream, localTracks]);

  useEffect(() => {
    if (presentationTracks.video) {
      if (!presentationStream) {
        addStream('presentation', presentationTracks);
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
  }, [presentationTracks]);

  const handleMediaError = (err: Error, kind: 'audio' | 'video' | 'screen') => {
    if (kind === 'audio') {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError({
          title: 'Microphone unavailable',
          body: 'Please check browser media permission settings.',
        });
      }
    }

    if (kind === 'video') {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError({
          title: 'Camera unavailable',
          body: 'Please check browser media permission settings.',
        });
      }
    }

    if (kind === 'screen') {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError({
          title: 'Screen share unavailable',
          body: 'Failed to share your screen.',
        });
      }
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
      if (localTracks.audio) {
        localTracks.audio.stop();

        getUserMedia({
          video: false,
          audio: {
            deviceId,
          },
        })
          .then((stream) => {
            setLocalTracks((value) => ({
              ...value,
              audio: stream.getAudioTracks()[0],
            }));
          })
          .catch((err) => {
            handleMediaError(err, 'audio');
          });
      }
    }

    if (kind === 'video_input') {
      setVideoInputDeviceId(deviceId);
      if (localTracks.video) {
        localTracks.video.stop();
        getUserMedia({
          audio: false,
          video: {
            deviceId,
          },
        })
          .then((stream) => {
            setLocalTracks((value) => ({
              ...value,
              video: stream.getVideoTracks()[0],
            }));
          })
          .catch((err) => {
            handleMediaError(err, 'video');
          });
      }
    }

    if (kind === 'audio_output') {
      setAudioOutputDeviceId(deviceId);
    }
  };

  useEffect(() => {
    onAudioOutputDeviceChange(audioOutputDeviceId);
  }, [audioOutputDeviceId]);

  const removeMediaTracks = () => {
    localTracks?.audio?.stop();
    localTracks?.video?.stop();
    presentationTracks?.audio?.stop();
    presentationTracks?.video?.stop();
  };

  const handleLeaveRoom = () => {
    disconnect();
  };

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
        <ErrorDialog onClose={onClose} title={error.title} body={error.body} />
      )}
      <Box pad='small' direction='row' gap='medium'>
        <Box width='80px'>
          <Button
            data-testid='btn-toggle-audio'
            size='large'
            onClick={() => {
              if (localTracks.audio) {
                localTracks.audio.stop();
                if (selfStream?.audioTrack) {
                  selfStream?.audioTrack.stop();
                }
                setAudioInputDeviceId('');
                setLocalTracks((value) => ({ ...value, audio: undefined }));
              } else {
                getUserMedia({
                  audio: audioInputDeviceId
                    ? { deviceId: audioInputDeviceId }
                    : true,
                  video: false,
                })
                  .then((stream) => {
                    setLocalTracks((value) => ({
                      ...value,
                      audio: stream?.getAudioTracks()[0],
                    }));
                    setAudioInputDeviceId(stream?.getAudioTracks()[0].id);
                  })
                  .catch((err) => {
                    handleMediaError(err, 'audio');
                  });
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
              if (localTracks.video) {
                setVideoInputDeviceId('');
                localTracks.video.stop();
                if (selfStream?.videoTrack) {
                  selfStream?.videoTrack.stop();
                }
                setLocalTracks((value) => ({ ...value, video: undefined }));
              } else {
                getUserMedia({
                  audio: false,
                  video: videoInputDeviceId
                    ? { deviceId: videoInputDeviceId }
                    : true,
                })
                  .then((stream) => {
                    setLocalTracks((value) => ({
                      ...value,
                      video: stream?.getVideoTracks()[0],
                    }));
                    setVideoInputDeviceId(stream?.getVideoTracks()[0].id);
                  })
                  .catch((err) => {
                    handleMediaError(err, 'video');
                  });
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

        <ScreenShareBox width='80px'>
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
                  .catch((err) => {
                    handleMediaError(err, 'screen');
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
        </ScreenShareBox>

        <ParticipantBox width='80px'>
          <Button
            data-testid='btn-toggle-participant-list'
            size='large'
            onClick={() => {
              onChangeParticipantsListVisible(!isParticipantsListVisible);
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
        </ParticipantBox>
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
            onClick={() => handleLeaveRoom()}
            color='status-error'
          />
        </Box>
      </RightBoxMenu>

      <LeaveButton
        data-testid='btn-leave-room'
        label='Leave'
        onClick={() => handleLeaveRoom()}
        color='status-error'
      />
    </Box>
  );
}
