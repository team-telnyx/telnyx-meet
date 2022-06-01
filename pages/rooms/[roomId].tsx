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
    use_mixed_audio: string;
    virtual_background: string;
  };

  const optionalFeatures = {
    isNetworkMetricsEnabled: queryParameters.network_metrics === 'true',
    isSimulcastEnabled: queryParameters.simulcast === 'true',
    isDialOutEnabled: queryParameters.dial_out === 'true',
    useMixedAudioForOutput:
      queryParameters.use_mixed_audio === 'false' ? false : true, // by default this is true
    isVirtualBackgroundFeatureEnabled:
      queryParameters.virtual_background === 'true',
  };

  return (
    <>
      {router.isReady && (
        <Rooms
          id={queryParameters.roomId}
          clientToken={queryParameters.client_token}
          refreshToken={queryParameters.refresh_token}
          optionalFeatures={optionalFeatures}
        />
      )}
    </>
  );
};

export default RoomId;
