import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, Spinner } from 'grommet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
} from '@fortawesome/free-solid-svg-icons';
import VideoTrack from './VideoTrack';
import { Participant } from '@telnyx/video';
import { TelnyxRoom } from '../hooks/room';
import { WebRTCStats } from './WebRTCStats';
import Bowser from 'bowser';

const VIDEO_BG_COLOR = '#111';

const allowedBrowsers = ['Chrome', 'Safari'];

function Feed({
  participant,
  streamKey,
  isReady,
  getParticipantStream,
  muteAudio = true,
  mirrorVideo = false,
  audioOutputDeviceId,
  getStatsForParticipantStream,
  dataId,
}: {
  participant: Participant;
  streamKey: string;
  isReady: TelnyxRoom['isReady'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  getStatsForParticipantStream: TelnyxRoom['getStatsForParticipantStream'];
  muteAudio: boolean;
  mirrorVideo: boolean;
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
  dataId?: string;
}) {
  const audioActivityIndicator = streamKey === 'self';
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [allowedBrowser, setAllowedBrowser] = useState(false);

  const intervalStatsId = useRef<any>();

  const stream = getParticipantStream(participant.id, streamKey);
  const isPresentation = streamKey === 'presentation';
  const context = participant.context
    ? JSON.parse(participant.context)
    : undefined;
  const showSpinner = !isReady(participant.id, streamKey);

  if (!context) {
    throw new Error(`No context for the participant`);
  }

  useEffect(() => {
    if (!stream) {
      return;
    }

    if (participant.isRemote && stream?.audioEnabled && stream?.isSpeaking) {
      const speakingElement = document.getElementById('speaking-box');
      if (speakingElement) {
        speakingElement.scrollIntoView();
      }
    }
  }, [stream]);

  useEffect(() => {
    if (!stream?.audioEnabled && !stream?.videoEnabled) {
      resetWebRTCStats();
    }
  }, [stream?.audioEnabled, stream?.videoEnabled]);

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
    if (!allowedBrowser) {
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
                  streamKey
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
            zIndex: 1,
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

  const renderedStats = renderStats();

  return (
    <div
      id={stream?.isSpeaking ? 'speaking-box' : ''}
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
        border:
          stream?.isSpeaking && audioActivityIndicator
            ? '3px solid yellow'
            : 'unset',
        height: isPresentation ? '100%' : 'unset',
      }}
    >
      {renderedStats}
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
            dataTestId={`video-feed-${streamKey}-${
              stream?.videoEnabled ? 'enabled' : 'notEnabled'
            }`}
            stream={stream}
            muteAudio={muteAudio}
            mirrorVideo={mirrorVideo}
            isPresentation={isPresentation}
          />
        )}

        {/* Large center text: */}
        {!stream?.videoEnabled && (
          <>
            <Box
              style={{ position: 'absolute', top: 0, left: 0 }}
              align='center'
              justify='center'
              fill
            >
              <Box
                background={{
                  color: participant.isRemote ? 'dark-1' : 'brand',
                  opacity: 'medium',
                }}
                pad='xsmall'
                round='xsmall'
              >
                <Text size='large'>
                  {context?.username}
                  {!participant.isRemote && <strong> (me)</strong>}
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
                color={!stream?.audioEnabled ? 'status-error' : 'accent-1'}
              >
                <FontAwesomeIcon
                  data-testid='icon-mic-status'
                  icon={stream?.audioEnabled ? faMicrophone : faMicrophoneSlash}
                  fixedWidth
                />
              </Text>
            )}
            {stream?.videoEnabled && (
              <Text>
                {context?.username}
                {!participant.isRemote && <strong> (me)</strong>}
              </Text>
            )}
          </Box>
        </Box>

        <Box style={{ position: 'absolute', right: 0, bottom: 0 }}>
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
            {context && (
              <Text color='status-disabled' size='xsmall'>
                {context.id}
              </Text>
            )}
          </Box>
        </Box>
      </div>
    </div>
  );
}

export default React.memo(Feed);
