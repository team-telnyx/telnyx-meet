import React, { useEffect, useRef, useState, useContext } from 'react';
import { Box, Button, TextInput, Text } from 'grommet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from '@fortawesome/free-solid-svg-icons';

import { LocalStreamsContext } from '../contexts/LocalStreamsContext';

interface Props {
  roomId: string;
  username: string;
  updateRoomId?: (value: string) => void;
  updateUsername: (value: string) => void;
  updateTokens: (tokens: { clientToken: string; refreshToken: string }) => void;
  setPopupMessage: any;
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
  setPopupMessage,
}: Props) => {
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [mute, setMute] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [localStreams, setLocalStreams] = useContext(LocalStreamsContext);

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
    if (videoElRef.current && localStreams?.localVideoTrack) {
      videoElRef.current.srcObject = new MediaStream([localStreams?.localVideoTrack]);
      setShowVideo(true);
    }
  }, [localStreams?.localVideoTrack]);

  useEffect(() => {
    if (localStreams?.localVideoTrack && !showVideo) {
      localStreams?.localVideoTrack.stop();
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
          const localAudioTrack = stream?.getAudioTracks()[0];
          const localVideoTrack = stream?.getVideoTracks()[0];
          setLocalStreams({localAudioTrack, localVideoTrack});
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

  useEffect(() => {
    if (localStreams?.localAudioTrack && mute) {
      localStreams?.localAudioTrack.stop();
      if(videoElRef.current && localStreams?.localVideoTrack) {
        videoElRef.current.srcObject = new MediaStream([localStreams?.localVideoTrack]);
      }
      setMute(true)
    } else {
      getUserMedia({
        video: showVideo,
        audio: true,
      }).then((stream) => {
        if (videoElRef.current) {
          videoElRef.current.srcObject = stream;
          const localAudioTrack = stream?.getAudioTracks()[0];
          setLocalStreams((streams: any) => ({...streams, localAudioTrack}));
          setMute(false)
        }
      }).catch(error => {
        setMute(true)
        setPopupMessage({
          title: 'Camera and microphone are blocked',
          body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
        })
      });
    }
  }, [mute]);

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
          backgroundColor: '#cecece',
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
          {localStreams?.localVideoTrack && (
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
