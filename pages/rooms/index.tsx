import PropTypes from 'prop-types';
import { Fragment, useEffect, useState } from 'react';
import Head from 'next/head';
import { Main } from 'grommet';

import Room from '../../components/Room';
import JoinRoom from '../../components/JoinRoom';

import { generateUsername, generateId } from '../../utils/helpers';

import ErrorDialog from '../../components/ErrorDialog';

const getUserMedia = async (
  constraints: MediaStreamConstraints
): Promise<MediaStream> => {
  return await navigator?.mediaDevices?.getUserMedia(constraints);
};

enum GRANT_STATUS {
  PENDING = 'pending',
  DENIED = 'denied',
  GRANTED = 'granted',
}
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
  const [hasGranted, setHasGranted] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

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

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const mic = devices.filter((mic) => mic.kind === 'audioinput')[0];
      const webcam = devices.filter(
        (webcam) => webcam.kind === 'videoinput'
      )[0];

      if (!mic.label && !webcam.label) {
        setError({
          title: 'Allow Telnyx Meet to use your camera and microphone',
          body: 'Telnyx Meet needs access to your camera and microphone so that other participants can see and hear you. Telnyx Meet will ask you to confirm this decision on each browser and computer you use.',
        });
      }
    });

    getUserMedia({
      video: true,
      audio: true,
    })
      .then((stream) => {
        setLocalStream(stream);
        setHasGranted(GRANT_STATUS.GRANTED);
        setError(undefined);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setError({
            title: 'Camera and microphone are blocked',
            body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
          });
        }
        setHasGranted(GRANT_STATUS.DENIED);
      });
  }, []);

  const onClose = () => {
    setError(undefined);
  };

  return (
    <Fragment>
      <Head>
        <title>Join Video Room</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>

      {error && (
        <ErrorDialog onClose={onClose} title={error.title} body={error.body} />
      )}

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
          <JoinRoom
            roomId={roomId || ''}
            username={username}
            updateUsername={setUsername}
            updateRoomId={setRoomId}
            updateTokens={setTokens}
            localStream={localStream}
          />
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
