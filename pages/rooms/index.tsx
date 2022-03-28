import PropTypes from 'prop-types';
import { Fragment, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { Main } from 'grommet';
import toast, { Toaster } from 'react-hot-toast';
import styled from 'styled-components';

import Room from 'components/Room';
import JoinRoom from 'components/JoinRoom';
import MediaPreview from 'components/MediaPreview';

import { generateUsername, generateId } from 'utils/helpers';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';
import {
  getUserMedia,
  MediaDeviceErrors,
} from 'components/MediaPreview/helper';
import {
  getItem,
  USERNAME_KEY,
  USER_PREFERENCE_AUDIO_ENABLED,
  USER_PREFERENCE_VIDEO_ENABLED,
} from 'utils/storage';
import { NetworkMetrics } from '@telnyx/video';
import { TelnyxRoom } from 'hooks/room';

const breakpointMedium = 1021;

const GridPreviewContainer = styled.div`
  display: grid;
  height: 100%;
  width: 100%;
  grid-template-columns: 1fr;
  align-items: center;

  @media (min-width: ${breakpointMedium}px) {
    grid-template-columns: 1fr 1fr;
  }
`;

function getUserName(): string {
  let user = getItem(USERNAME_KEY);
  if (user) {
    return user;
  } else {
    return generateUsername();
  }
}
export default function Rooms({
  id,
  showMetricsActionButton,
  clientToken,
  refreshToken,
}: {
  id: string;
  showMetricsActionButton: boolean;
  clientToken: string;
  refreshToken: string;
}) {
  const [roomId, setRoomId] = useState<string>();

  const [username, setUsername] = useState<string>('');

  const [tokens, setTokens] = useState<{
    clientToken: string;
    refreshToken: string;
  }>({
    clientToken: '',
    refreshToken: '',
  });
  const [isReady, setIsReady] = useState(false);
  const [audioInputDeviceId, setAudioInputDeviceId] = useState<
    string | undefined
  >();
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<
    string | undefined
  >();
  const [videoInputDeviceId, setVideoInputDeviceId] = useState<
    string | undefined
  >();

  const unreadMessages = useRef<TelnyxRoom['messages'] | null>(null);

  const [localTracks, setLocalTracks] = useState<{
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  }>({
    audio: undefined,
    video: undefined,
  });

  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

  const sendNotification = (message: { body: string }) => {
    toast(message.body, {
      duration: 6000,
      style: {
        minWidth: '420px',
        background: '#000',
        color: '#dadada',
      },
    });
  };

  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics>();

  useEffect(() => {
    setUsername(getUserName());
  }, []);

  useEffect(() => {
    setRoomId(id);
  }, [id]);

  useEffect(() => {
    if (roomId && username && tokens.clientToken && tokens.refreshToken) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [roomId, username, tokens]);

  useEffect(() => {
    if (!isReady) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const mic = devices.filter((mic) => mic.kind === 'audioinput')[0];
        const webcam = devices.filter(
          (webcam) => webcam.kind === 'videoinput'
        )[0];

        if (!mic.label && !webcam.label) {
          setError(MediaDeviceErrors.allowMediaWarning);
        }
      });

      let isVideoEnabled = getItem(USER_PREFERENCE_VIDEO_ENABLED) || null;

      let isAudioEnabled = getItem(USER_PREFERENCE_AUDIO_ENABLED) || null;

      getUserMedia({
        video: isVideoEnabled && isVideoEnabled === 'yes' ? true : false,
        audio: isAudioEnabled && isAudioEnabled === 'yes' ? true : false,
      })
        .then((stream) => {
          if (isAudioEnabled === 'yes') {
            const localAudioTrack = stream?.getAudioTracks()[0];
            setLocalTracks((value) => ({ ...value, audio: localAudioTrack }));
          }

          if (isVideoEnabled === 'yes') {
            const localVideoTrack = stream?.getVideoTracks()[0];
            setLocalTracks((value) => ({ ...value, video: localVideoTrack }));
          }

          setError(undefined);
        })
        .catch((error) => {
          if (
            error instanceof DOMException &&
            error.name === 'NotAllowedError'
          ) {
            setError(MediaDeviceErrors.mediaBlocked);
          }
        });
    }
  }, [isReady]);

  const onDisconnected = () => {
    setTokens({ clientToken: '', refreshToken: '' });
  };

  return (
    <Fragment>
      <Head>
        <title>Join Video Room</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <TelnyxMeetContext.Provider
        value={{
          audioInputDeviceId,
          audioOutputDeviceId,
          videoInputDeviceId,
          setAudioInputDeviceId,
          setAudioOutputDeviceId,
          setVideoInputDeviceId,
          localTracks,
          setLocalTracks,
          sendNotification,
          networkMetrics,
          setNetworkMetrics,
          unreadMessages,
        }}
      >
        <Main align='center' justify='center' background='light-2'>
          <Toaster />

          {roomId && isReady ? (
            <Room
              roomId={roomId}
              showMetricsActionButton={showMetricsActionButton}
              tokens={tokens}
              context={{
                id: generateId(),
                username,
              }}
              onDisconnected={onDisconnected}
            />
          ) : (
            <GridPreviewContainer>
              <MediaPreview error={error} setError={setError} />
              <JoinRoom
                roomId={roomId || ''}
                username={username}
                updateUsername={setUsername}
                updateRoomId={setRoomId}
                updateTokens={setTokens}
                clientToken={clientToken}
                refreshToken={refreshToken}
              />
            </GridPreviewContainer>
          )}
        </Main>
      </TelnyxMeetContext.Provider>
    </Fragment>
  );
}

Rooms.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
  }),
};
