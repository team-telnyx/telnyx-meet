import React from 'react';
import { Box, Button, TextInput } from 'grommet';

interface Props {
  roomId: string;
  username: string;
  updateRoomId?: (value: string) => void;
  updateUsername: (value: string) => void;
  updateTokens: (tokens: { clientToken: string; refreshToken: string }) => void;
}

const JoinRoom = ({
  roomId,
  username,
  updateRoomId,
  updateUsername,
  updateTokens,
}: Props) => {
  const joinRoom = async () => {
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

  return (
    <Box fill background='#1b1b1b' overflow='hidden'>
      <Box align='center' justify='center' fill gap='xsmall'>
        <Box
          background={{ color: 'white', opacity: 'weak' }}
          round='xsmall'
          pad='small'
        >
          Enter the Room UUID and choose a name for yourself
        </Box>
        <Box pad='small' gap='medium'>
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
            onClick={() => {
              joinRoom();
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default JoinRoom;
