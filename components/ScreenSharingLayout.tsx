import React from 'react';
import Feed from './Feed';
import { Participant } from '@telnyx/video';
import { TelnyxRoom } from '../hooks/room';
import styled from 'styled-components';
import { Pagination } from './Pagination';
import { ReactChild } from 'react';

const breakpointMedium = 1023;

const SideBar = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 347px);
  grid-gap: 5px 0px;
  align-content: start;

  @media (max-width: ${breakpointMedium}px) {
    display: none;
  }
`;

function NewSideBar({ children }: { children: ReactChild }) {
  return (
    <SideBar data-testid='sidebar' key='sidebar'>
      {children}
    </SideBar>
  );
}

const USERS_PER_PAGE = 4;

function ScreenSharingLayout({
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
  presenter: Participant;
  isPublished: TelnyxRoom['isPublished'];
  isSubscribed: TelnyxRoom['isSubscribed'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
  getStatsForParticipantStream: TelnyxRoom['getStatsForParticipantStream'];
  dataTestId: string;
}) {
  const participantsFeeds = Object.keys(participants).map((id) => {
    const participant = participants[id];

    return (
      <Feed
        key={`${participant.id}_self`}
        participant={participant}
        streamKey='self'
        isPublished={isPublished}
        isSubscribed={isSubscribed}
        getParticipantStream={getParticipantStream}
        muteAudio={!participant.isRemote}
        mirrorVideo={!participant.isRemote}
        audioOutputDeviceId={audioOutputDeviceId}
        getStatsForParticipantStream={getStatsForParticipantStream}
      />
    );
  });

  return (
    <div
      data-testid={dataTestId}
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
      }}
    >
      {participantsFeeds.length > 0 ? (
        <Pagination
          viewType='screen-sharing'
          RenderComponent={NewSideBar}
          data={participantsFeeds}
          dataLimit={USERS_PER_PAGE}
        />
      ) : null}
      <div
        style={{
          width: '100%',
          height: '100%',
          marginLeft: 16,
        }}
      >
        <Feed
          participant={presenter}
          streamKey='presentation'
          isPublished={isPublished}
          isSubscribed={isSubscribed}
          getParticipantStream={getParticipantStream}
          getStatsForParticipantStream={getStatsForParticipantStream}
          muteAudio={true}
          mirrorVideo={false}
        />
      </div>
    </div>
  );
}

export default React.memo(ScreenSharingLayout);
