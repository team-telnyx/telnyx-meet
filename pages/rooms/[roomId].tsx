import { Fragment } from 'react';
import { useRouter } from 'next/router';

import Rooms from './';

const RoomId = () => {
  const router = useRouter();
  const { roomId, network_metrics } = router.query as {
    roomId: string;
    network_metrics: string;
  };

  const showMetricsActionButton = network_metrics === 'true' ? true : false;

  return (
    <Fragment>
      <Rooms id={roomId} showMetricsActionButton={showMetricsActionButton} />
    </Fragment>
  );
};

export default RoomId;
