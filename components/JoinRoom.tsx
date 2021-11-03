import React, { useEffect, useRef } from 'react';
import { Box, Button, TextInput } from 'grommet';

interface Props {
  roomId: string;
  username: string;
  updateRoomId?: (value: string) => void;
  updateUsername: (value: string) => void;
  updateTokens: (tokens: { clientToken: string; refreshToken: string }) => void;
  localStream: MediaStream;
}

const JoinRoom = ({
  roomId,
  username,
  updateRoomId,
  updateUsername,
  updateTokens,
  localStream,
}: Props) => {
  const videoElRef = useRef<HTMLVideoElement>(null);
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

  console.log('localStream', localStream);
  console.log('videoElRef.current', videoElRef.current);

  if (videoElRef.current) {
    videoElRef.current.srcObject = localStream;
  }

  return (
    <div
      style={{
        display: 'grid',
        height: '100%',
        width: '100%',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'blue',
          height: '100%',
          width: '100%',
        }}
      >
        <div
          id='preview-video'
          style={{
            backgroundColor: '#202124',
            // paddingTop: '56.25%',
            borderRadius: 8,
            position: 'relative',
            minWidth: 740,
            alignSelf: 'center',
            overflow: 'hidden',
            height: '416px'
          }}
        >
          {localStream && (
            <video
              ref={videoElRef}
              playsInline={true}
              autoPlay={true}
              muted={true}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '100%',
                borderRadius: '8px',
                transform: 'scaleX(-1)',
                objectFit: 'cover',
              }}
            ></video>
          )}
          <div style={{ position: 'absolute', bottom: 16, left: '50%', marginLeft: '-80px' }}>
            <Button primary label="Mic" style={{marginRight: 20}}></Button>
            <Button secondary label="Cam" ></Button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Box pad='small' gap='medium'>
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
            onClick={() => {
              joinRoom();
            }}
          />
        </Box>
      </div>
    </div>
  );
};

export default JoinRoom;
