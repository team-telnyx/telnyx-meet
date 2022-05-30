import React, { MutableRefObject } from 'react';
import { Participant } from '@telnyx/video';

import { TelnyxRoom } from 'hooks/room';
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
  camera,
}: {
  participants: TelnyxRoom['state']['participants'];
  streams: TelnyxRoom['state']['streams'];
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  presenter?: Participant;
  dominantSpeakerId?: Participant['id'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  getStatsForParticipantStream: TelnyxRoom['getWebRTCStatsForStream'];
  dataTestId: string;
  camera: MutableRefObject<any>;
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
        hasVirtualBackground={camera?.current ? true : false}
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
      hasVirtualBackground={camera?.current ? true : false}
    />
  );
}
export default React.memo(Feeds);
