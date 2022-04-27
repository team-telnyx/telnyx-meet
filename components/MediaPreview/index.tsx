import React, { useEffect, useRef, useContext } from 'react';
import { Text } from 'grommet';
import styled from 'styled-components';

import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';
import { useMediaController } from 'hooks/mediaController';

import ErrorDialog from 'components/ErrorDialog';

import { MediaControlBar } from './MediaControlBar';
import { MediaDeviceErrors } from './helper';

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
    isAudioTrackEnabled,
    isVideoTrackEnabled,
    setIsAudioTrackEnabled,
    setIsVideoTrackEnabled,
    error,
    setError,
  } = useContext(TelnyxMeetContext);

  const localTracks = useMediaController();

  const videoElRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoElRef.current) {
      return;
    }

    if (localTracks?.video) {
      videoElRef.current.srcObject = new MediaStream([localTracks.video]);
    }
  }, [localTracks?.video]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioinput = devices.filter(
        (device) => device.kind === 'audioinput'
      )[0];
      const videoinput = devices.filter(
        (device) => device.kind === 'videoinput'
      )[0];

      if (!audioinput.label && !videoinput.label) {
        setError(MediaDeviceErrors.allowMediaWarning);
      }
    });

  }, [setError]);

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
        <ErrorDialog
          onClose={() => setError(undefined)}
          error={error}
        />
      )}
      <VideoPreview id='preview-video'>
        {isVideoTrackEnabled ? (
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
        ) : (
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
            isAudioTrackEnabled={isAudioTrackEnabled}
            isVideoTrackEnabled={isVideoTrackEnabled}
            setIsAudioTrackEnabled={setIsAudioTrackEnabled}
            setIsVideoTrackEnabled={setIsVideoTrackEnabled}
            error={error}
          />
        </div>
      </VideoPreview>
    </div>
  );
}

export default MediaPreview;
