import React from 'react';
import { Participant } from '@telnyx/video';

import GridLayout from './GridLayout';
import ScreenSharingLayout from './ScreenSharingLayout';
import { TelnyxRoom } from '../hooks/room';

function Feeds({
  participants,
  participantsByActivity,
  presenter,
  isReady,
  getParticipantStream,
  audioOutputDeviceId,
  getStatsForParticipantStream,
  dataTestId,
}: {
  participants: TelnyxRoom['state']['participants'];
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  presenter?: Participant;
  isReady: TelnyxRoom['isReady'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
  getStatsForParticipantStream: TelnyxRoom['getStatsForParticipantStream'];
  dataTestId: string;
}) {
  if (presenter) {
    return (
      <ScreenSharingLayout
        dataTestId={dataTestId}
        participants={participants}
        participantsByActivity={participantsByActivity}
        presenter={presenter}
        getParticipantStream={getParticipantStream}
        getStatsForParticipantStream={getStatsForParticipantStream}
      />
    );
  }

  return (
    <GridLayout
      dataTestId={dataTestId}
      participants={participants}
      participantsByActivity={participantsByActivity}
      getParticipantStream={getParticipantStream}
      getStatsForParticipantStream={getStatsForParticipantStream}
    />
  );
}
export default React.memo(Feeds);
