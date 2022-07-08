import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { Box, Text, Spinner, BoxExtendedProps } from 'grommet';
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
import { NetworkMetricsMonitor } from './NetworkMetricsMonitor';
import { VideoBitrate } from 'components/VideoBitrate';
import { VirtualBackground } from 'utils/virtualBackground';

const VIDEO_BG_COLOR = '#111';

const allowedBrowsers = ['Chrome', 'Safari'];

const FeedContainer = styled.div<{
  isPresentation: boolean;
  showAudioActivityIndicator: boolean;
}>`
  ${({ isPresentation, showAudioActivityIndicator }) => css`
    position: relative;
    overflow: hidden;
    height: ${isPresentation ? '100%' : 'unset'};
    padding-top: ${isPresentation
      ? 'unset'
      : `${(9 / 16) * 100}%`}; // 56.25% - 16:9 Aspect Ratio
    background-color: ${VIDEO_BG_COLOR};
    border-width: 3px;
    border-style: solid;
    border-color: ${showAudioActivityIndicator ? 'yellow' : '#1b1b1b'};
  `}
`;

const FeedHeader = styled.div<{ showBlackBackgroundColor: boolean }>`
  ${({ showBlackBackgroundColor }) => css`
    position: absolute;
    top: 0px;
    z-index: 2;
    width: 100%;
    height: 100%;
    background-color: ${showBlackBackgroundColor ? VIDEO_BG_COLOR : ''};
  `}
`;

const VideoContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const FeedFooter = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 2;
`;

const FeedParticipantNameCenter = styled(Box)<
  BoxExtendedProps & {
    showBlackBackgroundColor: boolean;
  }
>`
  ${({ showBlackBackgroundColor }) => css`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    background-color: ${showBlackBackgroundColor ? VIDEO_BG_COLOR : ''};
  `}
`;

const FeedSpinner = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
`;

type FeedProps = {
  participant: Participant;
  stream?: Stream;
  isSpeaking: boolean;
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  mirrorVideo: boolean;
  dataId?: string;
  virtualBackgroundCamera: VirtualBackground['camera'] | null;
};

function Feed({
  participant,
  stream,
  isSpeaking,
  mirrorVideo = false,
  getStatsForParticipantStream,
  dataId,
  virtualBackgroundCamera,
}: FeedProps) {
  const isTelephonyEngineParticipant =
    participant.origin === 'telephony_engine';
  const showAudioActivityIndicator = isSpeaking && stream?.key === 'self';
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [allowedBrowser, setAllowedBrowser] = useState(false);

  const isPresentation = stream?.key === 'presentation';
  const context = participant.context
    ? JSON.parse(participant.context)
    : undefined;
  const showSpinner = stream ? !stream.isConfigured : false;

  if (!context) {
    throw new Error(`No context for the participant`);
  }

  const renderStats = () => {
    if (!stream || !stream.isConfigured || !allowedBrowser) {
      return null;
    }

    return (
      <WebRTCStats
        participant={participant}
        stream={stream}
        getStatsForParticipantStream={getStatsForParticipantStream}
        showStatsOverlay={showStatsOverlay}
        setShowStatsOverlay={setShowStatsOverlay}
      ></WebRTCStats>
    );
  };

  const renderNetworkMetricsMonitor = () => {
    if (
      !stream ||
      !stream.isConfigured ||
      !allowedBrowser ||
      showStatsOverlay
    ) {
      return null;
    }

    return <NetworkMetricsMonitor participant={participant} />;
  };

  const renderVideoBitrate = () => {
    if (participant.origin === 'local') {
      return null;
    }

    if (!stream || !stream.isConfigured || !allowedBrowser) {
      return null;
    }

    return (
      <VideoBitrate
        participant={participant}
        stream={stream}
        getStatsForParticipantStream={getStatsForParticipantStream}
      />
    );
  };

  useEffect(() => {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const allowed = allowedBrowsers.includes(browser.getBrowserName());
    setAllowedBrowser(allowed);
  }, []);

  const VIDEO_ELEMENT_ID = `video-feed-${context.username
    ?.toLowerCase()
    .replace(' ', '-')}`;

  const showBlackBackgroundColor =
    !virtualBackgroundCamera?.current && !stream?.isVideoEnabled;

  return (
    <FeedContainer
      data-id={dataId}
      data-testid={VIDEO_ELEMENT_ID}
      isPresentation={isPresentation}
      showAudioActivityIndicator={showAudioActivityIndicator}
    >
      <FeedHeader showBlackBackgroundColor={showBlackBackgroundColor}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {renderStats()}
          {renderNetworkMetricsMonitor()}
          {renderVideoBitrate()}
        </div>
      </FeedHeader>

      <VideoContainer>
        {showSpinner && (
          <FeedSpinner data-testid='spinner-status'>
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
          </FeedSpinner>
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
            virtualBackgroundCamera={virtualBackgroundCamera}
          />
        )}
        {/* Large center text: */}
        {!stream?.isVideoEnabled && (
          <FeedParticipantNameCenter
            align='center'
            justify='center'
            fill
            showBlackBackgroundColor={showBlackBackgroundColor}
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
          </FeedParticipantNameCenter>
        )}
        <FeedFooter>
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
        </FeedFooter>
      </VideoContainer>
    </FeedContainer>
  );
}

export default React.memo(Feed);
