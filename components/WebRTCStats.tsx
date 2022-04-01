import React, { MouseEventHandler, ReactElement } from 'react';
import styled from 'styled-components';

const ContainerOverlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.7);
  top: 0;
  padding: 0px 5px;
`;

const CloseButton = styled.button`
  background-color: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
`;

const ContainerDescription = styled.div`
  display: block;
  margin: 0;
  padding: 0;
  boxsizing: border-box;
  border: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
`;

const Label = styled.div`
  display: inline-block;
  font-weight: 500;
  padding: 0 0.5em;
  width: 13em;
  text-align: right;
`;

const TabButton = styled.button<{ active: boolean }>`
  font-size: 11px;
  ${(props) => (props.active ? `border-bottom: 2px solid red;` : '')}
`;

interface DataRTCOutbound {
  id?: string;
  kind?: string;
  packetsSent?: number;
  bytesSent?: number;
  totalEncodeTime?: number;
  frameHeight?: number;
  frameWidth?: number;
  framesPerSecond?: number;
  totalPacketSendDelay?: number;
  encoderImplementation?: string;
  codecId?: string;
  remoteId?: string;
  retransmittedBytesSent?: number;
  headerBytesSent?: number;
  nackCount?: number;
  retransmittedPacketsSent?: number;
}

interface DataRTCInbound {
  id?: string;
  kind?: string;
  packetsReceived?: number;
  bytesReceived?: number;
  totalDecodeTime?: number;
  frameHeight?: number;
  frameWidth?: number;
  framesPerSecond?: number;
  totalInterFrameDelay?: number;
  decoderImplementation?: string;
  jitter?: number;
  packetsLost?: number;
  remoteId?: string;
  audioLevel?: number;
  totalAudioEnergy?: number;
  totalSamplesDuration?: number;
}
interface IWebRTCStats {
  data: any;
  onClose: MouseEventHandler<any>;
}

interface IDescription {
  label: string;
  value?: string | number;
}

function Description({ label, value }: IDescription) {
  return (
    <ContainerDescription>
      <Label>{`${label}`}</Label>
      <span>{value}</span>
    </ContainerDescription>
  );
}

function generateOutBoundRTPDescriptions(outboundRTPs: any) {
  let audioRTP: ReactElement | null = null;
  let videoRTP: ReactElement | null = null;

  const outboundRTPAudio = outboundRTPs['audio'];
  const outboundRTPVideo = outboundRTPs['video'];

  if (outboundRTPAudio) {
    Object.keys(outboundRTPAudio).forEach((item) => {
      const hasAudioStream = item.match(/RTCOutboundRTPAudioStream/gim);
      if (hasAudioStream) {
        const {
          kind = 'audio',
          packetsSent = 0,
          bytesSent = 0,
          retransmittedBytesSent = 0,
          headerBytesSent = 0,
          retransmittedPacketsSent = 0,
          nackCount = 0,
        }: DataRTCOutbound = outboundRTPAudio[item];

        audioRTP = (
          <React.Fragment key={kind}>
            <Description label={'Packets Sent'} value={packetsSent} />
            <Description label={'Bytes Sent'} value={bytesSent} />

            <Description
              label={'Retransmitted Packets'}
              value={retransmittedPacketsSent}
            />
            <Description
              label={'Retransmitted Bytes'}
              value={retransmittedBytesSent}
            />
            <Description
              label={'Header Bytes Sent'}
              value={`${headerBytesSent}`}
            />
            <Description label={'Nack Count'} value={nackCount} />
          </React.Fragment>
        );
      }
    });
  }

  if (outboundRTPVideo) {
    Object.keys(outboundRTPVideo).forEach((item) => {
      const hasVideoStream = item.match(/RTCOutboundRTPVideoStream/gim);
      if (hasVideoStream) {
        const {
          kind = 'video',
          packetsSent = 0,
          bytesSent = 0,
          totalEncodeTime = 0,
          frameWidth = 0,
          frameHeight = 0,
          framesPerSecond = 0,
          totalPacketSendDelay = 0,
          encoderImplementation = '',
        }: DataRTCOutbound = outboundRTPVideo[item];

        videoRTP = (
          <React.Fragment key={kind}>
            <Description label={'Packets Sent'} value={packetsSent} />
            <Description label={'Bytes Sent'} value={bytesSent} />

            <Description label={'T. Encode Time'} value={totalEncodeTime} />
            <Description
              label={'Frame WxH'}
              value={`${frameWidth} x ${frameHeight}`}
            />
            <Description label={'Frames Per Second'} value={framesPerSecond} />
            <Description
              label={'T. Packet Send Delay'}
              value={totalPacketSendDelay}
            />
            <Description
              label={'Encoder Implementation'}
              value={encoderImplementation}
            />
          </React.Fragment>
        );
      }
    });
  }

  return {
    audioRTP,
    videoRTP,
  };
}

function generateInboundRTPDescriptions(inboundRTPs: any) {
  let audioRTP: ReactElement | null = null;
  let videoRTP: ReactElement | null = null;

  const inboundRTPAudio = inboundRTPs['audio'];
  const inboundRTPVideo = inboundRTPs['video'];

  if (inboundRTPAudio) {
    Object.keys(inboundRTPAudio).forEach((item) => {
      const hasAudioStream = item.match(/RTCInboundRTPAudioStream/gim);
      if (hasAudioStream) {
        const {
          kind = 'audio',
          packetsReceived = 0,
          bytesReceived = 0,
          jitter = 0,
          packetsLost = 0,
          audioLevel = 0,
          totalAudioEnergy = 0,
          totalSamplesDuration = 0,
        }: DataRTCInbound = inboundRTPAudio[item];

        audioRTP = (
          <React.Fragment key={kind}>
            <Description label={'Jitter'} value={jitter} />
            <Description label={'Packets Lost'} value={packetsLost} />
            <Description label={'Packets Received'} value={packetsReceived} />
            <Description label={'Bytes Received'} value={bytesReceived} />

            <Description label={'Audio Level'} value={audioLevel} />
            <Description
              label={'T. Audio Energy'}
              value={`${totalAudioEnergy}`}
            />
            <Description
              label={'T. Samples Duration'}
              value={totalSamplesDuration}
            />
          </React.Fragment>
        );
      }
    });
  }

  if (inboundRTPVideo) {
    Object.keys(inboundRTPVideo).forEach((item) => {
      const hasVideoStream = item.match(/RTCInboundRTPVideoStream/gim);
      if (hasVideoStream) {
        const {
          kind = 'video',
          packetsReceived = 0,
          bytesReceived = 0,
          totalDecodeTime = 0,
          frameWidth = 0,
          frameHeight = 0,
          framesPerSecond = 0,
          totalInterFrameDelay = 0,
          jitter = 0,
          packetsLost = 0,
        }: DataRTCInbound = inboundRTPVideo[item];

        videoRTP = (
          <React.Fragment key={kind}>
            <Description label={'Jitter'} value={jitter} />
            <Description label={'Packets Lost'} value={packetsLost} />
            <Description label={'Packets Received'} value={packetsReceived} />
            <Description label={'Bytes Received'} value={bytesReceived} />
            <React.Fragment>
              <Description label={'T. Decode Time'} value={totalDecodeTime} />
              <Description
                label={'Frame WxH'}
                value={`${frameWidth} x ${frameHeight}`}
              />
              <Description
                label={'Frames Per Second'}
                value={framesPerSecond}
              />
              <Description
                label={'T. Inter Frame Delay'}
                value={totalInterFrameDelay}
              />
            </React.Fragment>
          </React.Fragment>
        );
      }
    });
  }

  return {
    audioRTP,
    videoRTP,
  };
}

function WebRTCStats({ data, onClose }: IWebRTCStats) {
  const [tab, setTab] = React.useState('audio');

  function getRTCDescriptionByType(): {
    audioRTP: ReactElement | null;
    videoRTP: ReactElement | null;
  } {
    let audioRTP = null,
      videoRTP = null;

    if (!data) {
      return {
        audioRTP,
        videoRTP,
      };
    }

    const inboundRTPs = data['receivers'];

    if (inboundRTPs && (inboundRTPs['audio'] || inboundRTPs['video'])) {
      return generateInboundRTPDescriptions(inboundRTPs);
    }

    const outboundRtps = data['senders'];

    if (outboundRtps && (outboundRtps['audio'] || outboundRtps['video'])) {
      return generateOutBoundRTPDescriptions(outboundRtps);
    }

    return {
      audioRTP,
      videoRTP,
    };
  }

  const { audioRTP, videoRTP } = getRTCDescriptionByType();

  return (
    <ContainerOverlay>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CloseButton onClick={onClose}>[x]</CloseButton>
      </div>
      {!data ? (
        <p>Sorry, we do not have any stat metrics yet</p>
      ) : (
        <React.Fragment>
          {audioRTP && (
            <TabButton active={tab === 'audio'} onClick={() => setTab('audio')}>
              Audio
            </TabButton>
          )}
          {videoRTP && (
            <TabButton active={tab === 'video'} onClick={() => setTab('video')}>
              Video
            </TabButton>
          )}
          {audioRTP && tab === 'audio' ? (
            <React.Fragment>{audioRTP}</React.Fragment>
          ) : (
            <React.Fragment>{videoRTP}</React.Fragment>
          )}
        </React.Fragment>
      )}
    </ContainerOverlay>
  );
}
export { WebRTCStats };
