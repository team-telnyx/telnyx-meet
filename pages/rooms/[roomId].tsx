import { Fragment } from 'react';
import { useRouter } from 'next/router';

import Rooms from './';

const RoomId = () => {
  const router = useRouter();
  const {
    roomId,
    client_token,
    refresh_token,
    network_metrics,
    simulcast,
  } = router.query as {
    roomId: string;
    client_token: string;
    refresh_token: string;
    network_metrics: string;
    simulcast: string;
  };

  const isFeatureEnabled = (feature: string) =>
    feature === 'true' ? true : false;

  const enableExperimentalFeature = {
    network_metrics: isFeatureEnabled(network_metrics),
    simulcast: isFeatureEnabled(simulcast),
  };

  return (
    <Fragment>
      <Rooms
        id={roomId}
        clientToken={client_token}
        refreshToken={refresh_token}
        enableExperimentalFeature={enableExperimentalFeature}
      />
    </Fragment>
  );
};

export default RoomId;
