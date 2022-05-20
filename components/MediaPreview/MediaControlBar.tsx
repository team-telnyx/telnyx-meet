import React, { ChangeEvent, Dispatch, SetStateAction, useRef } from 'react';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Box, Button, Text } from 'grommet';
import { FontAwesomeIcon as BaseFontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import {
  saveItem,
  USER_PREFERENCE_AUDIO_ENABLED,
  USER_PREFERENCE_VIDEO_ENABLED,
} from 'utils/storage';

import { getUserMedia, MediaDeviceErrors } from './helper';
import { VideoProcessor } from '@telnyx/video-processors';

const breakpointLarge = 1450;

const FontAwesomeIcon = styled(BaseFontAwesomeIcon)`
  @media (max-width: ${breakpointLarge}px) {
    font-size: 25px;
  }
`;

function MediaControlBar({
  audioInputDeviceId,
  videoInputDeviceId,
  setError,
  localTracks,
  setLocalTracks,
  camera,
}: {
  localTracks: {
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  };
  setLocalTracks: Dispatch<
    SetStateAction<{
      audio: MediaStreamTrack | undefined;
      video: MediaStreamTrack | undefined;
    }>
  >;
  audioInputDeviceId: string | undefined;
  videoInputDeviceId: string | undefined;
  setError: Dispatch<
    SetStateAction<{ title: string; body: string } | undefined>
  >;
  camera: any;
}) {
  const videoProcessor = useRef<any>(null);

  const handleAudioClick = () => {
    if (localTracks?.audio) {
      localTracks.audio.stop();
      setLocalTracks((value) => ({ ...value, audio: undefined }));
      saveItem(USER_PREFERENCE_AUDIO_ENABLED, 'no');
    } else {
      getUserMedia({
        audio: audioInputDeviceId ? { deviceId: audioInputDeviceId } : true,
        video: false,
      })
        .then((stream) => {
          setLocalTracks((value) => ({
            ...value,
            audio: stream?.getAudioTracks()[0],
          }));
          saveItem(USER_PREFERENCE_AUDIO_ENABLED, 'yes');
        })
        // TODO: avoid disable line
        // eslint-disable-next-line no-unused-vars
        .catch((err) => {
          setError(MediaDeviceErrors.mediaBlocked);
        });
    }
  };

  const handleVideoClick = () => {
    if (localTracks?.video) {
      localTracks.video.stop();
      setLocalTracks((value) => ({ ...value, video: undefined }));
      saveItem(USER_PREFERENCE_VIDEO_ENABLED, 'no');
    } else {
      getUserMedia({
        audio: false,
        video: videoInputDeviceId ? { deviceId: videoInputDeviceId } : true,
      })
        .then((stream) => {
          setLocalTracks((value) => ({
            ...value,
            video: stream?.getVideoTracks()[0],
          }));

          saveItem(USER_PREFERENCE_VIDEO_ENABLED, 'yes');
        })
        // TODO: avoid disable line
        // eslint-disable-next-line no-unused-vars
        .catch((err) => {
          setError(MediaDeviceErrors.mediaBlocked);
        });
    }
  };

  const handleVirtualBg = async (e: ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value || e.target.value === 'none') {
      getUserMedia({
        video: true,
        audio: true,
      }).then(async (stream) => {
        await camera.current?.stop();
        if (videoProcessor.current && videoProcessor.current?.segmentation) {
          await videoProcessor.current?.stop();
        }
        camera.current = null;

        setLocalTracks((value) => ({
          ...value,
          video: stream.getVideoTracks()[0],
        }));
      });
      return;
    }

    getUserMedia({
      video: {
        deviceId: videoInputDeviceId,
      },
      audio: true,
    })
      .then(async (stream) => {
        if (e.target.value !== 'blur') {
          // We use this image as our virtual background
          const image = new Image(996, 664);
          image.src = `//localhost:3000/${e.target.value}`;
          if (
            !videoProcessor.current ||
            !videoProcessor.current?.segmentation
          ) {
            videoProcessor.current = new VideoProcessor();
          }

          if (camera.current) {
            await camera.current?.stop();
          }

          const { videoCameraProcessor, canvasStream } =
            await videoProcessor.current.createVirtualBackgroundStream({
              stream,
              videoElementId: 'video-preview',
              canvasElementId: 'canvas',
              image,
              frameRate: 20,
            });

          videoCameraProcessor.start();
          camera.current = videoCameraProcessor;

          setLocalTracks((value) => ({
            ...value,
            video: canvasStream.getVideoTracks()[0],
          }));
        } else {
          if (
            !videoProcessor.current ||
            !videoProcessor.current?.segmentation
          ) {
            videoProcessor.current = new VideoProcessor();
          }

          if (camera.current) {
            await camera.current?.stop();
          }

          const { videoCameraProcessor, canvasStream } =
            await videoProcessor.current.createGaussianBlurBackgroundStream({
              stream,
              videoElementId: 'video-preview',
              frameRate: 20,
              canvasElementId: 'canvas',
            });

          videoCameraProcessor.start();
          camera.current = videoCameraProcessor;

          setLocalTracks((value) => ({
            ...value,
            video: canvasStream.getVideoTracks()[0],
          }));
        }
      })
      .catch((err) => {
        console.log(err, 'video');
      });
  };

  const renderSelectBackgroungImage = () => {
    const options = ['retro.webp', 'mansao.webp', 'paradise.jpg'].map(
      (item, index) => {
        return (
          <option key={index} value={item}>
            {item}
          </option>
        );
      }
    );
    return (
      <select name={'images'} onChange={handleVirtualBg}>
        <option value={'none'}>none</option>
        <option value={'blur'}>blur</option>
        {options}
      </select>
    );
  };

  return (
    <React.Fragment>
      <Button onClick={handleAudioClick} style={{ marginRight: 20 }}>
        <Box align='center' gap='xsmall'>
          <Box>
            <Text
              size='40.3px' // kinda hacky, make fa icon 48px
              color={!localTracks?.audio?.enabled ? 'status-error' : 'accent-1'}
            >
              <FontAwesomeIcon
                icon={
                  !localTracks?.audio?.enabled
                    ? faMicrophoneSlash
                    : faMicrophone
                }
                fixedWidth
              />
            </Text>
          </Box>
          <Text size='xsmall' color='light-6'>
            {!localTracks?.audio?.enabled ? 'Unmute mic' : 'Mute mic'}
          </Text>
        </Box>
      </Button>

      <Button onClick={handleVideoClick}>
        <Box align='center' gap='xsmall'>
          <Box>
            <Text
              size='40.3px' // kinda hacky, make fa icon 48px
              color={!localTracks?.video?.enabled ? 'status-error' : 'accent-1'}
            >
              <FontAwesomeIcon
                icon={!localTracks?.video?.enabled ? faVideoSlash : faVideo}
                fixedWidth
              />
            </Text>
          </Box>
          <Text size='xsmall' color='light-6'>
            {!localTracks?.video?.enabled ? 'Start video' : 'Stop video'}
          </Text>
        </Box>
      </Button>
      {renderSelectBackgroungImage()}
    </React.Fragment>
  );
}

export { MediaControlBar };
