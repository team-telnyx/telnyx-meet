import { Fragment, useEffect, useContext } from 'react';
import toast, { Toaster, Toast } from 'react-hot-toast';

import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

export default function Notification() {
  const { notification } = useContext(TelnyxMeetContext);

  useEffect(() => {
    if (notification) {
      toast(notification.message, {
        duration: 6000,
        style: {
          background: '#000',
          color: '#dadada',
        },
      });
    }
  }, [notification]);

  return (
    <Fragment>
      <Toaster />
    </Fragment>
  );
}
