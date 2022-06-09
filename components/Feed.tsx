import React, { useContext, useEffect, useRef, useState } from 'react';
import { Box, Text, Spinner } from 'grommet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
} from '@fortawesome/free-solid-svg-icons';
import Bowser from 'bowser';
import { Participant, Stream } from '@telnyx/video';

import { TelnyxRoom } from 'hooks/room';

import VideoTrack from 'components/VideoTrack';
import { WebRTCStats } from 'components/WebRTCStats';
import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

import { NetworkMetricsMonitor } from './NetworkMetricsMonitor';

const VIDEO_BG_COLOR = '#111';

const allowedBrowsers = ['Chrome', 'Safari'];

function Feed({
  participant,
  stream,
  isSpeaking,
  mirrorVideo = false,
  getStatsForParticipantStream,
  dataId,
  hasVirtualBackground,
}: {
  participant: Participant;
  stream?: Stream;
  isSpeaking: boolean;
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  mirrorVideo: boolean;
  dataId?: string;
  hasVirtualBackground: boolean;
}) {
  const { networkMetrics } = useContext(TelnyxMeetContext);
  const isTelephonyEngineParticipant =
    participant.origin === 'telephony_engine';
  const showAudioActivityIndicator = isSpeaking && stream?.key === 'self';
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [allowedBrowser, setAllowedBrowser] = useState(false);

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
    intervalStatsId.current = null;
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
            if (!intervalStatsId.current) {
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
            }
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
          {stream?.isConfigured && renderStats()}
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
        {(stream?.videoTrack || stream?.audioTrack) && (
          <VideoTrack
            id={VIDEO_ELEMENT_ID}
            dataTestId={`video-feed-${stream?.key}-${
              stream?.isVideoEnabled ? 'enabled' : 'notEnabled'
            }`}
            //@ts-ignore
            stream={stream}
            mirrorVideo={mirrorVideo}
            isPresentation={isPresentation}
            hasVirtualBackground={hasVirtualBackground}
          />
        )}

        {/* Large center text: */}
        {!stream?.isVideoEnabled && (
          <>
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 2,
                backgroundColor: !hasVirtualBackground ? VIDEO_BG_COLOR : '',
              }}
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
        <Box
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            zIndex: 2,
            backgroundColor: !hasVirtualBackground ? VIDEO_BG_COLOR : '',
          }}
        >
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
