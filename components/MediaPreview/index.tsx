import React, { useEffect, useState, useRef, useContext } from 'react';
import { Text } from 'grommet';
import styled from 'styled-components';

import ErrorDialog from '../ErrorDialog';
import { MediaControlBar } from './MediaControlBar';
import { getUserMedia, MediaDeviceErrors } from './helper';
import { TelnyxMeetContext } from '../../contexts/TelnyxMeetContext';

const breakpointSmall = 400;
const breakpointMedium = 530;
const breakpointLarge = 1450;

const VideoPreview = styled.div`
  position: relative;
  background-color: #202124;
  border-radius: 8px;
  overflow: hidden;
  align-self: center;
  min-width: 320px;
  height: 160px;

  @media (min-width: ${breakpointSmall}px) {
    min-width: 390px;
    height: 195px;
  }

  @media (min-width: ${breakpointMedium}px) {
    min-width: 500px;
    height: 250px;
  }

  @media (min-width: ${breakpointLarge}px) {
    min-width: 700px;
    height: 350px;
  }
`;

function MediaPreview() {
  const {
    audioInputDeviceId,
    setAudioInputDeviceId,
    videoInputDeviceId,
    setVideoInputDeviceId,
  } = useContext(TelnyxMeetContext);

  const [localAudioTrack, setLocalAudioTrack] = useState<
    MediaStreamTrack | undefined
  >();
  const [localVideoTrack, setLocalVideoTrack] = useState<
    MediaStreamTrack | undefined
  >();

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
        setError(MediaDeviceErrors.allowMediaWarning);
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
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setError(MediaDeviceErrors.mediaBlocked);
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
      <VideoPreview id='preview-video'>
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
            muted={true}
          ></audio>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 5,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <MediaControlBar
            audioTrack={localAudioTrack}
            setAudioTrack={setLocalAudioTrack}
            setAudioInputDeviceId={setAudioInputDeviceId}
            audioInputDeviceId={audioInputDeviceId}
            videoTrack={localVideoTrack}
            setVideoTrack={setLocalVideoTrack}
            setVideoInputDeviceId={setVideoInputDeviceId}
            videoInputDeviceId={videoInputDeviceId}
            setError={setError}
          />
        </div>
      </VideoPreview>
    </div>
  );
}

export default MediaPreview;
