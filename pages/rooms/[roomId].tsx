import { Fragment } from 'react';
import { useRouter } from 'next/router';

import Rooms from './';

const RoomId = () => {
  const router = useRouter();
  const { roomId, client_token, refresh_token } = router.query as {
    roomId: string;
    client_token: string;
    refresh_token: string;
  };

  return (
    <Fragment>
      <Rooms
        id={roomId}
        clientToken={client_token}
        refreshToken={refresh_token}
      />
    </Fragment>
  );
};

export default RoomId;
