import React, { Dispatch, SetStateAction } from 'react';

const TelnyxMeetContext = React.createContext<{
  audioInputDeviceId: string | undefined;
  audioOutputDeviceId: string | undefined;
  videoInputDeviceId: string | undefined;
  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setAudioOutputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setVideoInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
}>({
  audioInputDeviceId: undefined,
  audioOutputDeviceId: undefined,
  videoInputDeviceId: undefined,
  setAudioInputDeviceId: (
    value: React.SetStateAction<string | undefined>
  ) => {},
  setAudioOutputDeviceId: (
    value: React.SetStateAction<string | undefined>
  ) => {},
  setVideoInputDeviceId: (
    value: React.SetStateAction<string | undefined>
  ) => {},
});

export { TelnyxMeetContext };
