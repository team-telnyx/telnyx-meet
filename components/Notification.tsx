import { Fragment, useContext } from 'react';
import { Notification } from 'grommet';

import { TelnyxMeetContext } from 'contexts/TelnyxMeetContext';

export default function Notifications() {
  const { notification, sendNotification } = useContext(TelnyxMeetContext);

  const onClose = () => {
    sendNotification(undefined);
  };

  return (
    <Fragment>
      {notification && (
        <Notification
          toast
          title={notification.title}
          message={notification.message}
          onClose={onClose}
        />
      )}
    </Fragment>
  );
}
