import React, { useEffect, useState, useRef, useContext } from 'react';
import { Text } from 'grommet';
import styled from 'styled-components';

import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import ErrorDialog from 'components/ErrorDialog';

import { MediaControlBar } from './MediaControlBar';

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

function MediaPreview({ error, setError }: { error: any; setError: any }) {
  const {
    audioInputDeviceId,
    setAudioInputDeviceId,
    videoInputDeviceId,
    setVideoInputDeviceId,
    localAudioTrack,
    localVideoTrack,
    setLocalAudioTrack,
    setLocalVideoTrack,
  } = useContext(TelnyxMeetContext);

  const videoElRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoElRef.current) {
      return;
    }
    if (localVideoTrack) {
      const stream = new MediaStream();
      stream.addTrack(localVideoTrack);

      videoElRef.current.srcObject = stream;
    }
  }, [localVideoTrack]);

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
