import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Text } from 'grommet';

import ErrorDialog from './ErrorDialog';

const getUserMedia = async (
  constraints: MediaStreamConstraints
): Promise<MediaStream> => {
  return await navigator?.mediaDevices?.getUserMedia(constraints);
};

function MediaPreview() {
  const [localAudioTrack, setLocalAudioTrack] = useState<
    MediaStreamTrack | undefined
  >();
  const [localVideoTrack, setLocalVideoTrack] = useState<
    MediaStreamTrack | undefined
  >();

  const [audioInputDeviceId, setAudioInputDeviceId] = useState<
    string | undefined
  >();
  const [videoInputDeviceId, setVideoInputDeviceId] = useState<
    string | undefined
  >();
  // const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<
  //   string | undefined
  // >();
  // const [hasMediaPermission, setHasMediaPermission] = useState<boolean>(false);
  const [error, setError] = useState<
    { title: string; body: string } | undefined
  >(undefined);

  const videoElRef = useRef<HTMLVideoElement>(null);
  const audioElRef = useRef<HTMLAudioElement>(null);

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
        const localAudioTrack = stream?.getAudioTracks()[0];
        const localVideoTrack = stream?.getVideoTracks()[0];

        setLocalAudioTrack(localAudioTrack);
        setLocalVideoTrack(localVideoTrack);
        setAudioInputDeviceId(localAudioTrack.id);
        setVideoInputDeviceId(localVideoTrack.id);
        setError(undefined);

        if (videoElRef.current) {
          videoElRef.current.srcObject = stream;
          console.log(videoElRef.current.srcObject);
        }

        console.log(localVideoTrack);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setError({
            title: 'Camera and microphone are blocked',
            body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
          });
        }
      });
  }, []);

  useEffect(() => {
    if (audioElRef.current) {
      if (localAudioTrack) {
        const stream = new MediaStream();
        stream.addTrack(localAudioTrack);
        audioElRef.current.srcObject = stream;
      }
    }
    if (videoElRef.current) {
      if (localVideoTrack) {
        const stream = new MediaStream();
        stream.addTrack(localVideoTrack);
        videoElRef.current.srcObject = stream;
      }
    }
  }, [localAudioTrack, localVideoTrack]);

  const onClose = () => {
    setError(undefined);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#cecece',
        height: '100%',
        width: '100%',
      }}
    >
      {error && (
        <ErrorDialog onClose={onClose} title={error.title} body={error.body} />
      )}
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
        {localVideoTrack?.enabled && (
          <video
            id='video-preview'
            ref={videoElRef}
            playsInline={true}
            autoPlay={true}
            muted={false}
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
        {!localVideoTrack?.enabled && (
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

        {localAudioTrack?.enabled && (
          <audio
            ref={audioElRef}
            playsInline={true}
            autoPlay={true}
            muted={false}
          ></audio>
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
            onClick={() => {
              if (localAudioTrack) {
                localAudioTrack.stop();
                setLocalAudioTrack(undefined);
              } else {
                getUserMedia({
                  audio: audioInputDeviceId
                    ? { deviceId: audioInputDeviceId }
                    : true,
                  video: false,
                })
                  .then((stream) => {
                    setLocalAudioTrack(stream?.getAudioTracks()[0]);
                  })
                  .catch((err) => {
                    setError({
                      title: 'Camera and microphone are blocked',
                      body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
                    });
                  });
              }
            }}
            style={{ marginRight: 20 }}
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    !localAudioTrack?.enabled ? 'status-error' : 'accent-1'
                  }
                >
                  <FontAwesomeIcon
                    icon={
                      !localAudioTrack?.enabled
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    fixedWidth
                  />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {!localAudioTrack?.enabled ? 'Unmute mic' : 'Mute mic'}
              </Text>
            </Box>
          </Button>

          <Button
            onClick={() => {
              if (localVideoTrack) {
                localVideoTrack.stop();
                setLocalVideoTrack(undefined);
              } else {
                getUserMedia({
                  audio: false,
                  video: videoInputDeviceId
                    ? { deviceId: videoInputDeviceId }
                    : true,
                })
                  .then((stream) => {
                    setLocalVideoTrack(stream?.getVideoTracks()[0]);
                  })
                  .catch((err) => {
                    setError({
                      title: 'Camera and microphone are blocked',
                      body: "Telnyx Meet requires access to your camera and microphone. Click the camera blocked icon in your browser's address bar.",
                    });
                  });
              }
            }}
          >
            <Box align='center' gap='xsmall'>
              <Box>
                <Text
                  size='40.3px' // kinda hacky, make fa icon 48px
                  color={
                    !localVideoTrack?.enabled ? 'status-error' : 'accent-1'
                  }
                >
                  <FontAwesomeIcon
                    icon={!localVideoTrack?.enabled ? faVideoSlash : faVideo}
                    fixedWidth
                  />
                </Text>
              </Box>
              <Text size='xsmall' color='light-6'>
                {!localVideoTrack?.enabled ? 'Start video' : 'Stop video'}
              </Text>
            </Box>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MediaPreview;
