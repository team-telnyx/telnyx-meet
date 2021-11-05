import React, { useEffect, useRef, useState, useContext } from 'react';
import { Box, Button, TextInput, Text } from 'grommet';

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

  // useEffect(() => {
  //   if (
  //     videoElRef.current &&
  //     (localStreams?.localVideoTrack || localStreams?.localAudioTrack)
  //   ) {
  //     //@ts-ignore
  //     videoElRef.current.srcObject = new MediaStream([
  //       localStreams?.localVideoTrack,
  //     ]);
  //     setShowVideo(true);
  //   }
  // }, [localStreams?.localVideoTrack]);

  // useEffect(() => {
  //   debugger;
  //   if (localStreams?.localVideoTrack && !showVideo) {
  //     localStreams?.localVideoTrack.stop();
  //     if (videoElRef.current) {
  //       if (localStreams?.localAudioTrack) {
  //         videoElRef.current.srcObject = new MediaStream([
  //           localStreams?.localAudioTrack,
  //         ]);
  //       } else {
  //         videoElRef.current.srcObject = null;
  //       }
  //     }
  //     setShowVideo(false);
  //   } else if (showVideo) {
  //     getUserMedia({
  //       video: true,
  //       audio: enableAudio,
  //     })
  //       .then((stream) => {
  //         if (videoElRef.current) {
  //           const localAudioTrack = stream?.getAudioTracks()[0];
  //           const localVideoTrack = stream?.getVideoTracks()[0];
  //           if(localVideoTrack && localAudioTrack) {
  //             videoElRef.current.srcObject = new MediaStream([localAudioTrack, localVideoTrack]);
  //           } else {
  //             videoElRef.current.srcObject = new MediaStream([localVideoTrack]);
  //           }

  //           setLocalStreams({ localAudioTrack, localVideoTrack });
  //           setShowVideo(true);
  //         }
  //       })
  //       .catch((error) => {
  //         setShowVideo(false);
  //         setPopupMessage({
  //           title: 'Camera and microphone are blocked',
  //           body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
  //         });
  //       });
  //   }
  // }, [showVideo]);

  // useEffect(() => {
  //   if (localStreams?.localAudioTrack && !enableAudio) {
  //     localStreams?.localAudioTrack.stop();
  //     if (videoElRef.current && localStreams?.localVideoTrack) {
  //       videoElRef.current.srcObject = new MediaStream([
  //         localStreams?.localVideoTrack,
  //       ]);
  //     }
  //     setEnableAudio(false);
  //   } else if (enableAudio) {
  //     getUserMedia({
  //       video: showVideo,
  //       audio: true,
  //     })
  //       .then((stream) => {
  //         if (videoElRef.current) {
  //           videoElRef.current.srcObject = stream;
  //           const localAudioTrack = stream?.getAudioTracks()[0];
  //           setLocalStreams((streams: any) => ({
  //             ...streams,
  //             localAudioTrack,
  //           }));
  //           setEnableAudio(true);
  //         }
  //       })
  //       .catch((error) => {
  //         setEnableAudio(false);
  //         setPopupMessage({
  //           title: 'Camera and microphone are blocked',
  //           body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
  //         });
  //       });
  //   }
  // }, [enableAudio]);

  return (
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
  );
};

export default JoinRoom;
