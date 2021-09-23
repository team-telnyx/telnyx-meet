import React, { ReactChild } from 'react';
import Feed from './Feed';
import { Participant } from '@telnyx/video';
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
  isPublished,
  isSubscribed,
  getParticipantStream,
  audioOutputDeviceId,
  getStatsForParticipantStream,
  dataTestId,
}: {
  participants: TelnyxRoom['state']['participants'];
  isPublished: TelnyxRoom['isPublished'];
  isSubscribed: TelnyxRoom['isSubscribed'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  audioOutputDeviceId?: MediaDeviceInfo['deviceId'];
  getStatsForParticipantStream: TelnyxRoom['getStatsForParticipantStream'];
  dataTestId: string;
}) {
  const feeds = Object.keys(participants).map((id) => {
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

  const screenSize = useWindowSize();

  const xlarge = {
    size: 5,
    userPerPage: 12,
  };

  const large = {
    size: 4,
    userPerPage: 12,
  };

  const medium = {
    size: 3,
    userPerPage: 12,
  };

  const small = {
    size: 2,
    userPerPage: 6,
  };

  const xsmall = {
    size: 1,
    userPerPage: 2,
  };

  const resolutions: any = { xlarge, large, medium, small, xsmall };
  const columnsQuantity = screenSize
    ? resolutions[getWindowSize(screenSize?.width || 0)]
    : medium;

  const USERS_PER_PAGE = columnsQuantity.userPerPage;

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
          dataLimit={USERS_PER_PAGE}
          RenderComponent={GridView}
          layoutProps={layoutProps}
        />
      ) : null}
    </div>
  );
}

export default React.memo(GridLayout);
