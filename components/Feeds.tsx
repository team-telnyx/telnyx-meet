import React from 'react';
import { Participant } from '@telnyx/video';

import GridLayout from './GridLayout';
import ScreenSharingLayout from './ScreenSharingLayout';
import { TelnyxRoom } from '../hooks/room';

function Feeds({
  participants,
  streams,
  participantsByActivity,
  dominantSpeakerId,
  presenter,
  getParticipantStream,
  getStatsForParticipantStream,
  dataTestId,
}: {
  participants: TelnyxRoom['state']['participants'];
  streams: TelnyxRoom['state']['streams'];
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  presenter?: Participant;
  dominantSpeakerId?: Participant['id'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  dataTestId: string;
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
    />
  );
}
export default React.memo(Feeds);
