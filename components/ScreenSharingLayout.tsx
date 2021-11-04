import React, { useEffect, useState } from 'react';
import Feed from './Feed';
import { Participant } from '@telnyx/video';
import { TelnyxRoom } from '../hooks/room';
import styled from 'styled-components';
import { Pagination } from './Pagination';
import { ReactChild } from 'react';
import { useWindowSize } from '../hooks/windowSize';

const breakpointMedium = 1023;

const SideBar = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 347px);
  grid-gap: 5px 0px;
  align-content: start;
  max-height: calc(100% - 54px);
  overflow: hidden;

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

function ScreenSharingLayout({
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
  presenter: Participant;
  isReady: TelnyxRoom['isReady'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
  getStatsForParticipantStream: TelnyxRoom['getStatsForParticipantStream'];
  dataTestId: string;
}) {
  const USERS_PER_PAGE = 3;
  const NAVIGATION_BUTTONS_HEIGHT = 48;
  const FEED_MIN_HEIGHT = 154;

  const [maxParticipantPerPage, setMaxParticipantPerPage] =
    useState(USERS_PER_PAGE);

  const screenSize = useWindowSize();

  useEffect(() => {
    const feeds = document.getElementById('feeds');
    const feed = document.querySelectorAll('[data-id="video-feed-sidebar"]')[0];

    if (feeds) {
      let feedHeight =
        feed && feed.clientHeight ? feed.clientHeight : FEED_MIN_HEIGHT;

      const maxPerPage = Math.floor(
        (feeds.clientHeight - NAVIGATION_BUTTONS_HEIGHT) / feedHeight
      );

      if (maxPerPage > 0) {
        setMaxParticipantPerPage(maxPerPage);
      }
    }
  }, [maxParticipantPerPage, screenSize.height]);

  const participantsFeeds = [...participantsByActivity].map((id) => {
    const participant = participants[id];

    return (
      <Feed
        dataId='video-feed-sidebar'
        key={`${participant.id}_self`}
        participant={participant}
        streamKey='self'
        isReady={isReady}
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
      id='feeds'
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
          dataLimit={maxParticipantPerPage}
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
          isReady={isReady}
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
