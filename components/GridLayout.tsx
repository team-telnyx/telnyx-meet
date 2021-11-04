import React, { ReactChild, useEffect } from 'react';
import Feed from './Feed';
import { TelnyxRoom } from '../hooks/room';
import { useWindowSize, getWindowSize } from '../hooks/windowSize';
import { Pagination } from './Pagination';

function GridView({
  children,
  dataTestId,
  columnsQuantity,
}: {
  children: ReactChild;
  dataTestId: string;
  columnsQuantity: any;
}) {
  return (
    <div
      data-testid={dataTestId}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnsQuantity.size}, minmax(auto, 1fr))`,
        gridGap: 5,
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 20,
      }}
    >
      {children}
    </div>
  );
}

function GridLayout({
  participants,
  participantsByActivity,
  isReady,
  getParticipantStream,
  audioOutputDeviceId,
  getStatsForParticipantStream,
  dataTestId,
}: {
  participants: TelnyxRoom['state']['participants'];
  participantsByActivity: TelnyxRoom['participantsByActivity'];
  isReady: TelnyxRoom['isReady'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
  getStatsForParticipantStream: TelnyxRoom['getStatsForParticipantStream'];
  dataTestId: string;
}) {
  const NAVIGATION_BUTTONS_HEIGHT = 96;
  const REPORT_BUTTON_HEIGHT = 32;
  const screenSize = useWindowSize();

  const [maxParticipantPerPage, setMaxParticipantPerPage] = React.useState(2);

  useEffect(() => {
    const MAIN_FEEDS_MIN_WIDTH = 320;
    const MAIN_FEEDS_MIN_HEIGHT = 640;

    const FEED_MIN_WIDTH = 244;
    const FEED_MIN_HEIGHT = 137;

    const mainFeeds = document.getElementById('room-container');
    const mainFeedWidth = mainFeeds!.clientWidth || MAIN_FEEDS_MIN_WIDTH;
    const mainFeedHeight = mainFeeds!.clientHeight || MAIN_FEEDS_MIN_HEIGHT;
    const mainFeedsArea =
      mainFeedWidth *
      (mainFeedHeight - NAVIGATION_BUTTONS_HEIGHT - REPORT_BUTTON_HEIGHT);
    const feed = document.querySelectorAll('[data-id="video-feed-grid"]')[0];

    let feedArea;

    if (feed) {
      feedArea = feed.clientWidth * feed.clientHeight;
    } else {
      feedArea = FEED_MIN_WIDTH * FEED_MIN_HEIGHT;
    }

    const totalArea = Math.floor(mainFeedsArea / feedArea);

    if (totalArea > 0) {
      setMaxParticipantPerPage(totalArea);
    }
  }, [screenSize]);

  const feeds = [...participantsByActivity].map((id) => {
    const participant = participants[id];

    return (
      <Feed
        dataId='video-feed-grid'
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

  const xlarge = {
    size: 5,
  };

  const large = {
    size: 4,
  };

  const medium = {
    size: 3,
  };

  const small = {
    size: 2,
  };

  const xsmall = {
    size: 1,
  };

  const resolutions: any = { xlarge, large, medium, small, xsmall };
  const columnsQuantity = screenSize
    ? resolutions[getWindowSize(screenSize?.width || 0)]
    : medium;

  const layoutProps = {
    dataTestId,
    columnsQuantity,
  };

  return (
    <div>
      {feeds.length > 0 ? (
        <Pagination
          viewType='grid'
          data={feeds}
          dataLimit={maxParticipantPerPage}
          RenderComponent={GridView}
          layoutProps={layoutProps}
        />
      ) : null}
    </div>
  );
}

export default React.memo(GridLayout);
