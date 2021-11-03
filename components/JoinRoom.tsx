import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, TextInput, Text } from 'grommet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from '@fortawesome/free-solid-svg-icons';

interface Props {
  roomId: string;
  username: string;
  updateRoomId?: (value: string) => void;
  updateUsername: (value: string) => void;
  updateTokens: (tokens: { clientToken: string; refreshToken: string }) => void;
  localStream: MediaStream;
  setPopupMessage: any;
  setLocalStream: any;
}

const getUserMedia = async (
  constraints: MediaStreamConstraints
): Promise<MediaStream> => {
  return await navigator?.mediaDevices?.getUserMedia(constraints);
};

const JoinRoom = ({
  roomId,
  username,
  updateRoomId,
  updateUsername,
  updateTokens,
  localStream,
  setPopupMessage,
  setLocalStream,
}: Props) => {
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [mute, setMute] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  console.log('showVideo', showVideo)

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

  useEffect(() => {
    if (videoElRef.current && localStream) {
      videoElRef.current.srcObject = localStream;
      setShowVideo(true);
    }
  }, [localStream]);

  useEffect(() => {
    if (localStream && !showVideo) {
      localStream.getVideoTracks()[0].stop();
      if (videoElRef.current) {
        videoElRef.current.srcObject = null;
      }
      setShowVideo(false)
    } else {
      getUserMedia({
        video: true,
        audio: true,
      }).then((stream) => {
        if (videoElRef.current) {
          videoElRef.current.srcObject = stream;
          setLocalStream(stream);
          setShowVideo(true)
        }
      }).catch(error => {
        setShowVideo(false)
        setPopupMessage({
          title: 'Camera and microphone are blocked',
          body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
        })
      });
    }
  }, [showVideo]);

  console.log("localStream", localStream)

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
            height: '416px',
          }}
        >
          {localStream && (
            <video
              ref={videoElRef}
              playsInline={true}
              autoPlay={true}
              muted={mute}
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
          {!showVideo && (
            <Text
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                color: '#fff',
                transform: 'translateX(-50%)',
              }}
            >
              Camera is off
            </Text>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <Button
              style={{ marginRight: 20 }}
              onClick={() => setMute((mute) => !mute)}
            >
              <Box align='center' gap='xsmall'>
                <Box>
                  <Text
                    size='40.3px' // kinda hacky, make fa icon 48px
                    color={mute ? 'status-error' : 'accent-1'}
                  >
                    <FontAwesomeIcon
                      icon={mute ? faMicrophoneSlash : faMicrophone}
                      fixedWidth
                    />
                  </Text>
                </Box>
                <Text size='xsmall' color='light-6'>
                  {mute ? 'Unmute mic' : 'Mute mic'}
                </Text>
              </Box>
            </Button>

            <Button onClick={() => setShowVideo((showVideo) => !showVideo)}>
              <Box align='center' gap='xsmall'>
                <Box>
                  <Text
                    size='40.3px' // kinda hacky, make fa icon 48px
                    color={!showVideo ? 'status-error' : 'accent-1'}
                  >
                    <FontAwesomeIcon
                      icon={!showVideo ? faVideoSlash : faVideo}
                      fixedWidth
                    />
                  </Text>
                </Box>
                <Text size='xsmall' color='light-6'>
                  {!showVideo ? 'Start video' : 'Stop video'}
                </Text>
              </Box>
            </Button>
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
