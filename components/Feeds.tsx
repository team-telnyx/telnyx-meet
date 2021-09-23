import React from 'react';
import { Participant } from '@telnyx/video';

import GridLayout from './GridLayout';
import ScreenSharingLayout from './ScreenSharingLayout';
import { TelnyxRoom } from '../hooks/room';

function Feeds({
  participants,
  presenter,
  isPublished,
  isSubscribed,
  getParticipantStream,
  audioOutputDeviceId,
  getStatsForParticipantStream,
  dataTestId,
}: {
  participants: TelnyxRoom['state']['participants'];
  presenter?: Participant;
  isSubscribed: TelnyxRoom['isSubscribed'];
  isPublished: TelnyxRoom['isPublished'];
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
        presenter={presenter}
        isPublished={isPublished}
        isSubscribed={isSubscribed}
        getParticipantStream={getParticipantStream}
        audioOutputDeviceId={audioOutputDeviceId}
        getStatsForParticipantStream={getStatsForParticipantStream}
      />
    );
  }

  return (
    <GridLayout
      dataTestId={dataTestId}
      participants={participants}
      isPublished={isPublished}
      isSubscribed={isSubscribed}
      getParticipantStream={getParticipantStream}
      audioOutputDeviceId={audioOutputDeviceId}
      getStatsForParticipantStream={getStatsForParticipantStream}
    />
  );
}
export default React.memo(Feeds);
