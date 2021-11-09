import React, { Dispatch, SetStateAction } from 'react';

const TelnyxMeetContext = React.createContext<{
  audioInputDeviceId: string | undefined;
  audioOutputDeviceId: string | undefined;
  videoDeviceId: string | undefined;
  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>,
  setAudioOutputDeviceId: Dispatch<SetStateAction<string | undefined>>,
  setVideoDeviceId: Dispatch<SetStateAction<string | undefined>>,
}>({
  audioInputDeviceId: undefined,
  audioOutputDeviceId: undefined,
  videoDeviceId: undefined,
  setAudioInputDeviceId:  (value: React.SetStateAction<string | undefined>) => {},
  setAudioOutputDeviceId:  (value: React.SetStateAction<string | undefined>) => {},
  setVideoDeviceId: (value: React.SetStateAction<string | undefined>) => {},
});

export { TelnyxMeetContext };
