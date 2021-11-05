import PropTypes from 'prop-types';
import { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import { Main } from 'grommet';

import Room from '../../components/Room';
import JoinRoom from '../../components/JoinRoom';
import MediaPreview from '../../components/MediaPreview';

import { generateUsername, generateId } from '../../utils/helpers';
export default function Rooms({ id }: { id: string }) {
  const [roomId, setRoomId] = useState<string>();
  const [username, setUsername] = useState<string>(generateUsername());
  const [tokens, setTokens] = useState<{
    clientToken: string;
    refreshToken: string;
  }>({
    clientToken: '',
    refreshToken: '',
  });
  const [isReady, setIsReady] = useState(false);

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
          />
        ) : (
          <div
            style={{
              display: 'grid',
              height: '100%',
              width: '100%',
              gridTemplateColumns: '1fr 1fr',
              alignItems: 'center',
            }}
          >
            <MediaPreview />
            <JoinRoom
              roomId={roomId || ''}
              username={username}
              updateUsername={setUsername}
              updateRoomId={setRoomId}
              updateTokens={setTokens}
            />
          </div>
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
