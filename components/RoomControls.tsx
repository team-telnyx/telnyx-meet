import { getDevices } from '@telnyx/video';

import { useContext, useEffect, useState } from 'react';
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
import Bowser from 'bowser';

import ErrorDialog from './ErrorDialog';
import { TelnyxRoom } from '../hooks/room';

import { TelnyxMeetContext } from '../contexts/TelnyxMeetContext';

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
  return navigator?.mediaDevices?.getUserMedia(constraints);
};

const getDisplayMedia = async (): Promise<MediaStream> => {
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
  room,
  disableScreenshare,
  onAudioOutputDeviceChange,
}: {
  isParticipantsListVisible: boolean;
  onChangeParticipantsListVisible: Function;
  room: TelnyxRoom;
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
  } = useContext(TelnyxMeetContext);

  const [devices, setDevices] = useState<any>({});
  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

  const [selfTracks, setSelfTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });
  const [presentationAudioTrack, setPresentationAudioTrack] =
    useState<MediaStreamTrack>();
  const [presentationVideoTrack, setPresentationVideoTrack] =
    useState<MediaStreamTrack>();

  const [isSafari, setIsSafari] = useState(false);

  const publisher = room.state.publisher;

  const selfStream = room.getParticipantStream(publisher.participantId, 'self');
  const presentationStream = room.getParticipantStream(
    publisher.participantId,
    'presentation'
  );

  const participantCount = Object.keys(room.state.participants).length;

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
    const browser = Bowser.getParser(window.navigator.userAgent);
    if (browser.getBrowserName().toLocaleLowerCase() === 'safari') {
      setIsSafari(true);
    }
  }, []);

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
    if (selfStream && !selfTracks.audio && !selfTracks.video) {
      room.unpublish('self');

      return;
    }

    if (selfTracks.audio || selfTracks.video) {
      room.publish({
        key: 'self',
        audioTrack: selfTracks.audio,
        videoTrack: selfTracks.video,
      });
    }

    getAndSetDevices(); // will populate the devices based on the current permissions
  }, [selfTracks]);

  useEffect(() => {
    if (audioInputDeviceId || videoInputDeviceId) {
      getUserMedia({
        video: videoInputDeviceId ? { deviceId: videoInputDeviceId } : false,
        audio: audioInputDeviceId ? { deviceId: audioInputDeviceId } : false,
      })
        .then((stream) => {
          const localAudioTrack = stream?.getAudioTracks()[0];
          const localVideoTrack = stream?.getVideoTracks()[0];

          setSelfTracks({ audio: localAudioTrack, video: localVideoTrack });
        })
        .catch((error) => {
          console.warn('getUserMedia', error);
        });
    } else if (room.state.publisher.streamsPublished['self']) {
      room.unpublish('self');
    }
  }, []);

  useEffect(() => {
    if (presentationStream && !presentationVideoTrack) {
      room.unpublish('presentation');

      return;
    }

    if (presentationVideoTrack) {
      room.publish({
        key: 'presentation',
        videoTrack: presentationVideoTrack,
        audioTrack: presentationAudioTrack,
      });

      presentationVideoTrack.onended = () => {
        room.unpublish('presentation');
      };
    }
  }, [presentationVideoTrack, presentationAudioTrack]);

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
      if (selfTracks.audio) {
        selfTracks.audio.stop();

        getUserMedia({
          video: false,
          audio: {
            deviceId,
          },
        })
          .then((stream) => {
            setSelfTracks((value) => ({
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
      if (selfTracks.video) {
        selfTracks.video.stop();
        getUserMedia({
          audio: false,
          video: {
            deviceId,
          },
        })
          .then((stream) => {
            setSelfTracks((value) => ({
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

  const onCloseSafari = () => {
    if (document && document.getElementsByTagName('audio')) {
      document.getElementsByTagName('audio')[0]?.play();
    }
    setIsSafari(false);
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

      {isSafari && (
        <ErrorDialog
          onClose={onCloseSafari}
          title={'Participating in the meeting'}
          body={'Click on unmute mic button to start to talk'}
        />
      )}
      <Box pad='small' direction='row' gap='medium'>
        <Box width='80px'>
          <Button
            data-testid='btn-toggle-audio'
            size='large'
            onClick={() => {
              if (selfTracks.audio) {
                selfTracks.audio.stop();
                setSelfTracks((value) => ({ ...value, audio: undefined }));
              } else {
                getUserMedia({
                  audio: audioInputDeviceId
                    ? { deviceId: audioInputDeviceId }
                    : true,
                  video: false,
                })
                  .then((stream) => {
                    setSelfTracks((value) => ({
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
            disabled={
              publisher.streamsPublished['self']
                ? publisher.streamsPublished['self'].status === 'pending'
                : false
            }
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    !selfStream?.audioEnabled ? 'status-error' : 'accent-1'
                  }
                >
                  <FontAwesomeIconStyled
                    icon={
                      !selfStream?.audioEnabled
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    fixedWidth
                  />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {!selfStream?.audioEnabled ? 'Unmute mic' : 'Mute mic'}
              </Text>
            </Box>
          </Button>
        </Box>

        <Box width='80px'>
          <Button
            data-testid='btn-toggle-video'
            size='large'
            onClick={() => {
              if (selfTracks.video) {
                selfTracks.video.stop();
                setSelfTracks((value) => ({ ...value, video: undefined }));
              } else {
                getUserMedia({
                  audio: false,
                  video: videoInputDeviceId
                    ? { deviceId: videoInputDeviceId }
                    : true,
                })
                  .then((stream) => {
                    setSelfTracks((value) => ({
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
            disabled={
              publisher.streamsPublished['self']
                ? publisher.streamsPublished['self'].status === 'pending'
                : false
            }
            data-e2e='toggle video'
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    !selfStream?.videoEnabled ? 'status-error' : 'accent-1'
                  }
                >
                  <FontAwesomeIconStyled
                    icon={!selfStream?.videoEnabled ? faVideoSlash : faVideo}
                    fixedWidth
                  />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {!selfStream?.videoEnabled ? 'Start video' : 'Stop video'}
              </Text>
            </Box>
          </Button>
        </Box>

        <ScreenShareBox width='80px'>
          <Button
            data-testid='btn-toggle-screen-sharing'
            size='large'
            disabled={
              disableScreenshare ||
              publisher.streamsPublished['presentation']?.status === 'pending'
            }
            onClick={() => {
              if (presentationAudioTrack || presentationVideoTrack) {
                presentationAudioTrack?.stop();
                presentationVideoTrack?.stop();

                setPresentationAudioTrack(undefined);
                setPresentationVideoTrack(undefined);
              } else {
                getDisplayMedia()
                  .then((stream) => {
                    setPresentationAudioTrack(stream?.getAudioTracks()[0]);
                    setPresentationVideoTrack(stream?.getVideoTracks()[0]);
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
                    presentationStream?.videoEnabled
                      ? 'accent-1'
                      : 'status-error'
                  }
                >
                  <FontAwesomeIconStyled icon={faLaptop} fixedWidth />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {presentationStream?.videoEnabled
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
            onClick={() => {
              room.disconnect();
            }}
            color='status-error'
          />
        </Box>
      </RightBoxMenu>

      <LeaveButton
        data-testid='btn-leave-room'
        label='Leave'
        onClick={() => {
          room.disconnect();
        }}
        color='status-error'
      />
    </Box>
  );
}
