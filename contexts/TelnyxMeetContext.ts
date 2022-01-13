import React, { Dispatch, SetStateAction } from 'react';

const TelnyxMeetContext = React.createContext<{
  audioInputDeviceId: string | undefined;
  audioOutputDeviceId: string | undefined;
  videoInputDeviceId: string | undefined;

  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setAudioOutputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setVideoInputDeviceId: Dispatch<SetStateAction<string | undefined>>;

  localAudioTrack: MediaStreamTrack | undefined; 
  setLocalAudioTrack: Dispatch<SetStateAction<MediaStreamTrack | undefined>>;
  localVideoTrack : MediaStreamTrack | undefined;
  setLocalVideoTrack: Dispatch<SetStateAction<MediaStreamTrack | undefined>>;

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
  localAudioTrack: undefined,
  localVideoTrack : undefined,
  setLocalAudioTrack: (
    value: React.SetStateAction<MediaStreamTrack | undefined>
  ) => {},
  setLocalVideoTrack: (
    value: React.SetStateAction<MediaStreamTrack | undefined>
  ) => {},
});

export { TelnyxMeetContext };
