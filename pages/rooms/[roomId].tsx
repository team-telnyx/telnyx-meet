import { Fragment } from 'react';
import { useRouter } from 'next/router';

import Rooms from './';

const RoomId = () => {
  const router = useRouter();
  const { roomId, network_metrics, client_token, refresh_token } =
    router.query as {
      roomId: string;
      network_metrics: string;
      client_token: string;
      refresh_token: string;
    };

  const showMetricsActionButton = network_metrics === 'true' ? true : false;

  return (
    <Fragment>
      <Rooms
        id={roomId}
        showMetricsActionButton={showMetricsActionButton}
        clientToken={client_token}
        refreshToken={refresh_token}
      />
    </Fragment>
  );
};

export default RoomId;
