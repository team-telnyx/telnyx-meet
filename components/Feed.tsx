import React, { useEffect, useRef, useState } from 'react';
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
  const isTelephonyEngineParticipant =
    participant.origin === 'telephony_engine';
  const showAudioActivityIndicator = isSpeaking && stream?.key === 'self';
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [allowedBrowser, setAllowedBrowser] = useState(false);
  const [bitrateScore, setBitrateScore] = useState(0);
  const [packeLossScore, setPacketLossScore] = useState(0);

  const lastResult = new Map<string, IRTCOutboundRTPVideoStreamReport>();


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

  interface IRTCOutboundRTPVideoStreamReport {
    timestamp?: number;
    bytesSent?: number;
    headerBytesSent?: number;
    packetsSent?: number;
    id?: string;
  }

  function getConnectionQualityByBitrate(stats) {
    if (stats.senders.audio) {
      // console.log(stats.senders.audio);
    }
    if (stats.senders.video) {
      Object.keys(stats.senders.video).forEach((key) => {
        if (key.includes('RTCOutboundRTPVideoStream') && stats.senders.video) {
          let report: IRTCOutboundRTPVideoStreamReport =
            stats.senders.video[key];

          let bytes;
          let headerBytes;
          let packets;

          const now = report.timestamp;
          bytes = report.bytesSent;
          headerBytes = report.headerBytesSent;

          packets = report.packetsSent;
          if (lastResult && lastResult.has(report.id)) {
            // calculate bitrate
            const bitrate =
              (8 * (bytes - lastResult.get(report.id).bytesSent)) /
              (now - lastResult.get(report.id).timestamp);
            const headerrate =
              (8 * (headerBytes - lastResult.get(report.id).headerBytesSent)) /
              (now - lastResult.get(report.id).timestamp);

            console.log('bitrate===>', bitrate);

            if (bitrate > 10 && bitrate < 50) {
              setBitrateScore(1);
            } else if (bitrate > 50 && bitrate < 100) {
              setBitrateScore(2);
            } else if (bitrate > 100 && bitrate < 200) {
              setBitrateScore(3);
            } else if (bitrate > 200 && bitrate < 400) {
              setBitrateScore(4);
            } else if (bitrate > 400) {
              setBitrateScore(5);
            } else {
              setBitrateScore(0);
            }
          }

          lastResult.set(report.id, report);
        }
      });
    }
  }

  function getConnectionQualityByPacketLoss(stats) {
    console.log('stats===>', stats);
    // console.log('baselineReport===>', baselineReport)
    let remoteId = '';
    if (stats.senders.audio) {
      // console.log(stats.senders.audio);
    }
    if (stats.senders.video) {
      Object.keys(stats.senders.video).forEach((key) => {
        if (key.includes('RTCOutboundRTPVideoStream') && stats.senders.video) {
          let rTCOutboundRTPVideoStream = stats.senders.video[key];

          console.log(
            'RTCOutboundRTPVideoStream===>',
            rTCOutboundRTPVideoStream
          );

          remoteId = rTCOutboundRTPVideoStream.remoteId;
          console.log('remoteId===>', remoteId);
        }
      });

      if (stats.senders.video && remoteId) {
        Object.keys(stats.senders.video).forEach((key) => {
          if (key.includes(remoteId) && stats.senders.video) {
            let report = stats.senders.video[key];
            console.log('Inboud====>', report);
            console.log('fractionLost====>', report.fractionLost);
            console.log('fractionLost*100====>', Math.floor(report.fractionLost * 100));
            let packetLoss = report.fractionLost * 100;

            if (packetLoss === undefined) {
                  setPacketLossScore(5)
          } else if (packetLoss <= 2) {
              // quality = 100; // Full 5 bars.
              setPacketLossScore(5)

          } else if (packetLoss <= 4) {
            setPacketLossScore(4) // 4 bars
          } else if (packetLoss <= 6) {
            setPacketLossScore(3) // 3 bars
          } else if (packetLoss <= 8) {
            setPacketLossScore(2) // 2 bars
          } else if (packetLoss <= 12) {
            setPacketLossScore(1); // 1 bars
          } else {
            setPacketLossScore(1); // Still 1 bar, but slower climb-up.
          }
          }
        });
      }
    }
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

                getConnectionQualityByBitrate(stats);
                getConnectionQualityByPacketLoss(stats);

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
      const STEP = 3;
      const BARS_ARRAY = [0, 1, 2, 3, 4];

      return (
        <div>
          <div
            style={{ color: '#FFF', zIndex: 99999999, position: 'relative' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                height: '20px',
                alignItems: 'flex-end',
              }}
            >
              Bitrate level: {bitrateScore} -{' '}
              {BARS_ARRAY.map((level) => (
                <div
                  key={level}
                  style={{
                    width: '2px',
                    marginRight: '1px',
                    height: `${STEP * (level + 1)}px`,
                    background:
                      bitrateScore > level
                        ? 'white'
                        : 'rgba(255, 255, 255, 0.2)',
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <div
              style={{ color: '#FFF', zIndex: 99999999, position: 'relative' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  height: '20px',
                  alignItems: 'flex-end',
                }}
              >
                Fraction Lost level: {packeLossScore} -{' '}
                {BARS_ARRAY.map((level) => (
                  <div
                    key={level}
                    style={{
                      width: '2px',
                      marginRight: '1px',
                      height: `${STEP * (level + 1)}px`,
                      background:
                      packeLossScore > level
                          ? 'white'
                          : 'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <WebRTCStats
            onClose={() => resetWebRTCStats()}
            data={stats}
          ></WebRTCStats>
        </div>
      );
    }
  }

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
