import React, { useEffect } from 'react';
import { Participant } from '@telnyx/video';

import {  NetworkMetrics, TelnyxRoom } from 'hooks/room';
import GridLayout from 'components/GridLayout';
import ScreenSharingLayout from 'components/ScreenSharingLayout';

function Feeds({
  participants,
  streams,
  participantsByActivity,
  dominantSpeakerId,
  presenter,
  getParticipantStream,
  getStatsForParticipantStream,
  dataTestId,
  connectionQualityLevel,
  enableNetworkMetrics,
}: {
  participants: TelnyxRoom['state']['participants'];
  streams: TelnyxRoom['state']['streams'];
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  presenter?: Participant;
  dominantSpeakerId?: Participant['id'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  dataTestId: string;
  connectionQualityLevel: Map<string, NetworkMetrics>;
  enableNetworkMetrics: any;
}) {
  useEffect(() => {
    setTimeout(() => {
      let participantIds = [];
      participants.forEach((item) => {
        participantIds.push(item.id);
      });
      enableNetworkMetrics(participantIds, { includeStreams: true });
    }, 10000);
  }, [participants]);

  if (presenter) {
    return (
      <ScreenSharingLayout
        dataTestId={dataTestId}
        participants={participants}
        streams={streams}
        participantsByActivity={participantsByActivity}
        presenter={presenter}
        dominantSpeakerId={dominantSpeakerId}
        getParticipantStream={getParticipantStream}
        getStatsForParticipantStream={getStatsForParticipantStream}
      />
    );
  }

  return (
    <GridLayout
      dataTestId={dataTestId}
      participants={participants}
      streams={streams}
      participantsByActivity={participantsByActivity}
      dominantSpeakerId={dominantSpeakerId}
      getParticipantStream={getParticipantStream}
      getStatsForParticipantStream={getStatsForParticipantStream}
      connectionQualityLevel={connectionQualityLevel}
    />
  );
}
export default React.memo(Feeds);
