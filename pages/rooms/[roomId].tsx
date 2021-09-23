import { Fragment } from 'react';
import { useRouter } from 'next/router';

import Rooms from './';

const RoomId = () => {
  const router = useRouter();
  const { roomId } = router.query as { roomId: string };

  return (
    <Fragment>
      <Rooms id={roomId} />
    </Fragment>
  );
};

export default RoomId;
