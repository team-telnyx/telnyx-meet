import PropTypes from 'prop-types';
import { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import { Main } from 'grommet';
import styled from 'styled-components';

import Room from '../../components/Room';
import JoinRoom from '../../components/JoinRoom';
import MediaPreview from '../../components/MediaPreview';

import { generateUsername, generateId } from '../../utils/helpers';
import { getItem, USERNAME_KEY } from '../../utils/storage';


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
export default function Rooms({ id }: { id: string }) {
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
  const [videoInputDeviceId, setVideoInputDeviceId] = useState<
    string | undefined
  >();

  useEffect(() => {
    setUsername(getUserName())
  }, []) 

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
        {roomId && isReady ? (
          <Room
            roomId={roomId}
            tokens={tokens}
            context={{
              id: generateId(),
              username,
            }}
            onDisconnected={onDisconnected}
            audioInputDeviceId={audioInputDeviceId}
            setAudioInputDeviceId={setAudioInputDeviceId}
            videoInputDeviceId={videoInputDeviceId}
            setVideoInputDeviceId={setVideoInputDeviceId}
          />
        ) : (
          <GridPreviewContainer>
            <MediaPreview
              audioInputDeviceId={audioInputDeviceId}
              setAudioInputDeviceId={setAudioInputDeviceId}
              videoInputDeviceId={videoInputDeviceId}
              setVideoInputDeviceId={setVideoInputDeviceId}
            />
            <JoinRoom
              roomId={roomId || ''}
              username={username}
              updateUsername={setUsername}
              updateRoomId={setRoomId}
              updateTokens={setTokens}
            />
          </GridPreviewContainer>
        )}
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
