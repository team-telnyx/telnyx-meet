import React, { useState, useEffect } from 'react';
import { Box, Text } from 'grommet';
import styled from 'styled-components';
import { Participant, Stream } from '@telnyx/video';

import { TelnyxRoom } from 'hooks/room';

const Container = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  top: 0;
  padding: 0px 5px;
`;

const TabButtonContainer = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 1;
`;

const TabButton = styled.button<{ active: boolean }>`
  min-width: 42px;
  font-size: 11px;
  ${(props) => (props.active ? `border-bottom: 2px solid red;` : '')}
  cursor: pointer;
`;

function StreamQualityControls({
  participantId,
  streamKey,
  updateSubscription,
  getStatsForParticipantStream,
}: {
  participantId: Participant['id'];
  streamKey: Stream['key'];
  updateSubscription: TelnyxRoom['updateSubscription'];
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
}) {
  const [tab, setTab] = React.useState('medium');
  const [bitrate, setBitrate] = useState(0);
  const [currentBytesReceived, setCurrentBytesReceived] = useState(0);
  const [previousBytesReceived, setPreviousBytesReceived] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const stats = await getStatsForParticipantStream(
          participantId,
          streamKey
        );

        let inboundRTPVideo: any;

        if (stats['receivers'] && stats['receivers']['video']) {
          inboundRTPVideo = stats['receivers']['video'];

          Object.keys(inboundRTPVideo).forEach((item) => {
            const hasVideoStream = item.match(/RTCInboundRTPVideoStream/gim);
            if (hasVideoStream) {
              setCurrentBytesReceived(inboundRTPVideo[item]['bytesReceived']);
            }
          });
        }
      } catch (error) {
        setBitrate(0);
        setCurrentBytesReceived(0);
        setPreviousBytesReceived(0);
        throw error;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [participantId, streamKey, getStatsForParticipantStream]);

  useEffect(() => {
    if (currentBytesReceived === 0) {
      setBitrate(0);
      return;
    }

    if (previousBytesReceived === 0) {
      setBitrate(8 * currentBytesReceived);
      setPreviousBytesReceived(currentBytesReceived);
      return;
    }

    setBitrate(8 * (currentBytesReceived - previousBytesReceived));
    setPreviousBytesReceived(currentBytesReceived);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBytesReceived]);

  const handleStreamQualityClick = (quality: string) => {
    updateSubscription(participantId, streamKey, {
      streamQuality: quality,
    });
  };

  return (
    <Container>
      <TabButtonContainer>
        <TabButton
          active={tab === 'low'}
          onClick={() => {
            setTab('low');
            handleStreamQualityClick('low');
          }}
        >
          l
        </TabButton>
        <TabButton
          active={tab === 'medium'}
          onClick={() => {
            setTab('medium');
            handleStreamQualityClick('medium');
          }}
        >
          m
        </TabButton>
        <TabButton
          active={tab === 'high'}
          onClick={() => {
            setTab('high');
            handleStreamQualityClick('high');
          }}
        >
          h
        </TabButton>
      </TabButtonContainer>
      <Box style={{ position: 'absolute', right: 0, bottom: 0 }}>
        <Box
          direction='row'
          align='center'
          gap='xsmall'
          background={{ color: 'dark-1', opacity: 'medium' }}
          margin='xxsmall'
          pad='xxsmall'
          round='xxsmall'
        >
          <Text color='status-disabled' size='xsmall'>
            {Math.floor(bitrate / 1000)} kbps
          </Text>
        </Box>
      </Box>
    </Container>
  );
}
export { StreamQualityControls };
