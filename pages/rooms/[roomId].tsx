import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/router';

import Rooms from './';

const RoomId = () => {
  const router = useRouter();
  const queryParameters = router.query as {
    roomId: string;
    client_token: string;
    refresh_token: string;
    network_metrics: string;
    simulcast: string;
    dial_out: string;
  };

  const [isRouterReady, setIsRouterReady] = useState(false);

  const optionalFeatures = {
    isNetworkMetricsEnabled: queryParameters.network_metrics === 'true',
    isSimulcastEnabled: queryParameters.simulcast === 'true',
    isDialOutEnabled: queryParameters.dial_out === 'true',
  };

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    setIsRouterReady(true);
  }, [router.isReady]);

  return (
    <Fragment>
      {isRouterReady && (
        <Rooms
          id={queryParameters.roomId}
          clientToken={queryParameters.client_token}
          refreshToken={queryParameters.refresh_token}
          optionalFeatures={optionalFeatures}
        />
      )}
    </Fragment>
  );
};

export default RoomId;
