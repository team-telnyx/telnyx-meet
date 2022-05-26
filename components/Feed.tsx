import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
} from 'react';
import { Box, Text, Spinner } from 'grommet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
} from '@fortawesome/free-solid-svg-icons';
import Bowser from 'bowser';
import { Participant, Stream } from '@telnyx/video';
import { VideoProcessor } from '@telnyx/video-processors';

import { TelnyxRoom } from 'hooks/room';

import VideoTrack from 'components/VideoTrack';
import { WebRTCStats } from 'components/WebRTCStats';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import { getUserMedia } from 'utils/userMedia';

import { NetworkMetricsMonitor } from './NetworkMetricsMonitor';
import { MediaDeviceErrors } from 'components/MediaPreview/helper';

const VIDEO_BG_COLOR = '#111';

const allowedBrowsers = ['Chrome', 'Safari'];

function Feed({
  participant,
  stream,
  isSpeaking,
  mirrorVideo = false,
  getStatsForParticipantStream,
  dataId,
}: {
  participant: Participant;
  stream?: Stream;
  isSpeaking: boolean;
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  mirrorVideo: boolean;
  dataId?: string;
}) {
  const { networkMetrics } = useContext(TelnyxMeetContext);
  const isTelephonyEngineParticipant =
    participant.origin === 'telephony_engine';
  const showAudioActivityIndicator = isSpeaking && stream?.key === 'self';
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [allowedBrowser, setAllowedBrowser] = useState(false);
  const { videoInputDeviceId, setVideoInputDeviceId } =
    useContext(TelnyxMeetContext);

  const camera = useRef<any>(null);
  const videoProcessor = useRef<any>(null);

  const intervalStatsId = useRef<any>();

  const isPresentation = stream?.key === 'presentation';
  const context = participant.context
    ? JSON.parse(participant.context)
    : undefined;
  const showSpinner = stream ? !stream.isConfigured : false;

  if (!context) {
    throw new Error(`No context for the participant`);
  }

  useEffect(() => {
    if (!stream?.isAudioEnabled && !stream?.isVideoEnabled) {
      resetWebRTCStats();
    }
  }, [stream?.isAudioEnabled, stream?.isVideoEnabled]);

  useEffect(() => {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const allowed = allowedBrowsers.includes(browser.getBrowserName());
    setAllowedBrowser(allowed);
  }, []);

  function resetWebRTCStats() {
    clearInterval(intervalStatsId.current);
    setStats(null);
    setShowStatsOverlay(false);
  }

  function renderStats() {
    if (!stream || !allowedBrowser) {
      return null;
    }

    if (!showStatsOverlay || !stats) {
      return (
        <button
          style={{ margin: 4 }}
          onClick={async () => {
            intervalStatsId.current = setInterval(async () => {
              try {
                const stats = await getStatsForParticipantStream(
                  participant.id,
                  stream.key
                );

                if (stats) {
                  setStats(stats);
                  setShowStatsOverlay(true);
                }
              } catch (error) {
                resetWebRTCStats();
                throw error;
              }
            }, 500);
          }}
          disabled={!stream}
        >
          stats
        </button>
      );
    } else {
      return (
        <WebRTCStats
          onClose={() => resetWebRTCStats()}
          data={stats}
        ></WebRTCStats>
      );
    }
  }

  const VIDEO_ELEMENT_ID = `video-feed-${context.username
    ?.toLowerCase()
    .replace(' ', '-')}`;

  const peerMetrics = networkMetrics ? networkMetrics[participant.id] : null;

  const handleDeviceError = (kind: 'audio' | 'video') => {
    console.log(MediaDeviceErrors.mediaBlocked);
  };

  const handleVirtualBg = async (e: ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value || e.target.value === 'none') {
      getUserMedia({
        kind: 'video',
        deviceId: videoInputDeviceId,
        callbacks: {
          onTrackUpdate: async (
            kind: 'audio' | 'video',
            track: MediaStreamTrack | undefined
          ) => {
            await camera.current?.stop();
            if (
              videoProcessor.current &&
              videoProcessor.current?.segmentation
            ) {
              await videoProcessor.current?.stop();
              videoProcessor.current = null;
            }
            camera.current = null;

            if (track && kind === 'video') {
              setVideoInputDeviceId(track.id);
            }
          },
          onDeviceError: handleDeviceError,
        },
      });
    }

    getUserMedia({
      kind: 'video',
      deviceId: videoInputDeviceId,
      callbacks: {
        onTrackUpdate: async (
          kind: 'audio' | 'video',
          track: MediaStreamTrack | undefined
        ) => {
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
                track,
                videoElementId: VIDEO_ELEMENT_ID,
                canvasElementId: 'canvas',
                image,
                frameRate: 20,
              });

            videoCameraProcessor.start();
            camera.current = videoCameraProcessor;

            if (track && kind === 'video') {
              setVideoInputDeviceId(track.id);
            }
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
                track,
                videoElementId: VIDEO_ELEMENT_ID,
                frameRate: 20,
                canvasElementId: 'canvas',
              });

            videoCameraProcessor.start();
            camera.current = videoCameraProcessor;

            if (track && kind === 'video') {
              setVideoInputDeviceId(track.id);
            }
          }
        },
        onDeviceError: handleDeviceError,
      },
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
    <div
      // id={stream?.isSpeaking ? 'speaking-box' : ''}
      data-id={dataId}
      data-testid={VIDEO_ELEMENT_ID}
      style={{
        backgroundColor: VIDEO_BG_COLOR,
        position: 'relative',
        paddingTop: isPresentation
          ? 'unset'
          : `${(9 / 16) * 100}%` /* 56.25% - 16:9 Aspect Ratio */,
        overflow: 'hidden',
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: showAudioActivityIndicator ? 'yellow' : '#1b1b1b',
        height: isPresentation ? '100%' : 'unset',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0px',
          zIndex: 2,
          width: '100%',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {renderStats()}
          {participant.origin === 'local' && renderSelectBackgroungImage()}
          {!showStatsOverlay && peerMetrics && (
            <NetworkMetricsMonitor
              connectionQuality={peerMetrics.connectionQuality}
            />
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {showSpinner && (
          <div
            data-testid='spinner-status'
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
            }}
          >
            <Spinner
              border={[
                {
                  side: 'all',
                  color: 'brand',
                  size: 'medium',
                  style: 'dotted',
                },
              ]}
            />
          </div>
        )}
        {/* {(stream?.videoTrack || stream?.audioTrack) && ( */}
        <VideoTrack
          id={VIDEO_ELEMENT_ID}
          dataTestId={`video-feed-${stream?.key}-${
            stream?.isVideoEnabled ? 'enabled' : 'notEnabled'
          }`}
          //@ts-ignore
          stream={stream}
          mirrorVideo={mirrorVideo}
          isPresentation={isPresentation}
          virtualBackgroundEnabled={camera.current}
        />
        {/* )} */}

        {/* Large center text: */}
        {!stream?.isVideoEnabled && (
          <>
            <Box
              style={{ position: 'absolute', top: 0, left: 0 }}
              align='center'
              justify='center'
              fill
            >
              <Box
                background={{
                  color: participant.origin !== 'local' ? 'dark-1' : 'brand',
                  opacity: 'medium',
                }}
                pad='xsmall'
                round='xsmall'
              >
                <Text size='large'>
                  {context?.username}
                  {participant.origin === 'local' && <strong> (me)</strong>}
                </Text>
              </Box>
            </Box>
          </>
        )}

        {/* Small bottom text: */}
        <Box style={{ position: 'absolute', left: 0, bottom: 0, zIndex: 2 }}>
          <Box
            direction='row'
            align='center'
            gap='xsmall'
            background={{
              color: 'dark-1',
              opacity: 'medium',
            }}
            margin='xxsmall'
            pad='xxsmall'
            round='xxsmall'
          >
            {!isPresentation && (
              <Text
                size='small'
                color={
                  !isTelephonyEngineParticipant && !stream?.isAudioEnabled
                    ? 'status-error'
                    : 'accent-1'
                }
              >
                <FontAwesomeIcon
                  data-testid='icon-mic-status'
                  icon={
                    isTelephonyEngineParticipant || stream?.isAudioEnabled
                      ? faMicrophone
                      : faMicrophoneSlash
                  }
                  fixedWidth
                />
                {stream?.isAudioCensored && <Text size='small'> Silenced</Text>}
              </Text>
            )}
            {stream?.isVideoEnabled && (
              <Text>
                {context?.username}
                {participant.origin === 'local' && <strong> (me)</strong>}
              </Text>
            )}
          </Box>
        </Box>
      </div>
    </div>
  );
}

export default React.memo(Feed);
