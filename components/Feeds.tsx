import React, { useEffect } from 'react';
import { Participant } from '@telnyx/video';

import { TelnyxRoom } from 'hooks/room';
import GridLayout from 'components/GridLayout';
import ScreenSharingLayout from 'components/ScreenSharingLayout';
import { NetworkMetrics } from '@telnyx/video/lib/metrics/interfaces';

function Feeds({
  participants,
  streams,
  participantsByActivity,
  dominantSpeakerId,
  presenter,
  getParticipantStream,
  getStatsForParticipantStream,
  dataTestId,
  networkMetrics,
}: {
  participants: TelnyxRoom['state']['participants'];
  streams: TelnyxRoom['state']['streams'];
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  presenter?: Participant;
  dominantSpeakerId?: Participant['id'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  dataTestId: string;
  networkMetrics: TelnyxRoom['networkMetrics']
}) {

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
      networkMetrics={networkMetrics}
    />
  );
}
export default React.memo(Feeds);
