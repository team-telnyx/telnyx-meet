import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import { StreamQualityControls } from 'components/StreamQualityControls';

const VIDEO_BG_COLOR = '#111';

const allowedBrowsers = ['Chrome', 'Safari'];

function Feed({
  participant,
  stream,
  isSpeaking,
  mirrorVideo = false,
  getStatsForParticipantStream,
  updateSubscription,
  dataId,
}: {
  participant: Participant;
  stream?: Stream;
  isSpeaking: boolean;
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  updateSubscription: TelnyxRoom['updateSubscription'];
  mirrorVideo: boolean;
  dataId?: string;
}) {
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
          style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            zIndex: 10,
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

  const renderedStreamControls = useMemo(() => {
    if (
      !stream ||
      !stream.isConfigured ||
      !participant ||
      !allowedBrowser ||
      participant.origin === 'local'
    ) {
      return null;
    }

    return (
      <StreamQualityControls
        participantId={participant.id}
        streamKey={stream.key}
        updateSubscription={updateSubscription}
        getStatsForParticipantStream={getStatsForParticipantStream}
      />
    );
  }, [participant, stream, updateSubscription]);

  const renderedStats = renderStats();

  return (
    <div
      // id={stream?.isSpeaking ? 'speaking-box' : ''}
      data-id={dataId}
      data-testid={`video-feed-${context.username
        ?.toLowerCase()
        .replace(' ', '-')}`}
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
      {renderedStats}
      {renderedStreamControls}
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
            dataTestId={`video-feed-${stream.key}-${
              stream?.isVideoEnabled ? 'enabled' : 'notEnabled'
            }`}
            stream={stream}
            mirrorVideo={mirrorVideo}
            isPresentation={isPresentation}
          />
        )}

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
        <Box style={{ position: 'absolute', left: 0, bottom: 0 }}>
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
