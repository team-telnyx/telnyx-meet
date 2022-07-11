import { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { Main } from 'grommet';
import toast, { Toaster } from 'react-hot-toast';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { NetworkMetrics } from '@telnyx/video';

import Room from 'components/Room';
import JoinRoom from 'components/JoinRoom';
import MediaPreview from 'components/MediaPreview';

import { generateUsername, generateId, getPlatform } from 'utils/helpers';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import { TelnyxRoom } from 'hooks/room';
import { getItem, USERNAME_KEY } from 'utils/storage';

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
  clientToken,
  refreshToken,
}: {
  id: string;
  clientToken: string;
  refreshToken: string;
}) {
  const router = useRouter();
  const queryParameters = router.query as {
    audio_control: string;
    dial_out: string;
    network_metrics: string;
    simulcast: string;
    virtual_background: string;
  };
  const optionalFeatures = {
    isAudioControlEnabled: queryParameters.audio_control === 'true',
    isDialOutEnabled: queryParameters.dial_out === 'true',
    isNetworkMetricsEnabled: queryParameters.network_metrics === 'true',
    isSimulcastEnabled: queryParameters.simulcast === 'true',
    isVirtualBackgroundFeatureEnabled:
      queryParameters.virtual_background === 'true',
  };

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

  const [isAudioTrackEnabled, setIsAudioTrackEnabled] =
    useState<boolean>(false);
  const [isVideoTrackEnabled, setIsVideoTrackEnabled] =
    useState<boolean>(false);
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

  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

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

  const onDisconnected = () => {
    setTokens({ clientToken: '', refreshToken: '' });
  };

  return (
    <Fragment>
      <Head>
        <title>Join Video Room</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Main align='center' justify='center' background='light-2'>
        <Toaster />

        <TelnyxMeetContext.Provider
          value={{
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
            sendNotification,
            networkMetrics,
            setNetworkMetrics,
            unreadMessages,
            optionalFeatures,
            isVideoPlaying,
            setIsVideoPlaying,
          }}
        >
          {roomId && isReady ? (
            <Room
              roomId={roomId}
              tokens={tokens}
              context={{
                id: generateId(),
                username,
              }}
              onDisconnected={onDisconnected}
            />
          ) : (
            <GridPreviewContainer>
              <MediaPreview />
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
        </TelnyxMeetContext.Provider>
      </Main>
    </Fragment>
  );
}

Rooms.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
  }),
};
