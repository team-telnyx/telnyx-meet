import React, { useState } from 'react';
import { Box, Button, TextInput } from 'grommet';

import { saveItem, USERNAME_KEY } from 'utils/storage';
import ErrorDialog from 'components/ErrorDialog';
import { MediaDeviceErrors } from 'components/MediaPreview/helper';

interface Props {
  roomId: string;
  username: string;
  updateRoomId?: React.Dispatch<React.SetStateAction<string | undefined>>;
  updateUsername: React.Dispatch<React.SetStateAction<string>>;
  updateTokens: React.Dispatch<
    React.SetStateAction<{ clientToken: string; refreshToken: string }>
  >;
  clientToken: string;
  refreshToken: string;
}

const JoinRoom = ({
  roomId,
  username,
  updateRoomId,
  updateUsername,
  updateTokens,
  clientToken,
  refreshToken,
}: Props) => {
  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

  const checkAudioBrowserPermission = async () => {
    const result = await window?.navigator?.mediaDevices
      ?.getUserMedia({
        audio: true,
      })
      .then((stream) => {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
        return true;
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          return false;
        }
      });

    return result;
  };

  const joinRoom = async () => {
    if (clientToken && refreshToken) {
      updateTokens({
        clientToken,
        refreshToken,
      });

      return;
    }

    const response = await fetch('/api/client_token', {
      method: 'POST',
      body: JSON.stringify({
        room_id: roomId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      updateTokens({
        clientToken: data.token,
        refreshToken: data.refresh_token,
      });
    }
  };

  const onClose = () => {
    setError(undefined);
  };

  return (
    <Box
      pad='small'
      gap='medium'
      style={{
        justifySelf: 'center',
      }}
    >
      {error && (
        <ErrorDialog onClose={onClose} title={error.title} body={error.body} />
      )}
      <Box
        background={{ color: 'white', opacity: 'weak' }}
        round='xsmall'
        pad='small'
      >
        Enter the Room UUID and choose a name for yourself
      </Box>
      <TextInput
        data-testid='input-room-uuid'
        value={roomId}
        onChange={(e) => {
          if (typeof updateRoomId === 'function') {
            updateRoomId(e.target.value);
          }
        }}
        placeholder={'Room UUID'}
      />

      <TextInput
        data-testid='input-username'
        value={username}
        onChange={(e) => {
          updateUsername(e.target.value);
        }}
        placeholder='Your name'
      />
      <Button
        data-testid='btn-join-room'
        primary
        disabled={!roomId}
        label='Join room'
        onClick={async () => {
          saveItem(USERNAME_KEY, username);
          const hasAudioPermission = await checkAudioBrowserPermission();
          if (hasAudioPermission) {
            joinRoom();
          } else {
            setError(MediaDeviceErrors.mediaBlocked);
          }
        }}
      />
    </Box>
  );
};

export default JoinRoom;
