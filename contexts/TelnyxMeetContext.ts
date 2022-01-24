import React, { Dispatch, SetStateAction } from 'react';
import toast, { Toast } from 'react-hot-toast';

const TelnyxMeetContext = React.createContext<{
  audioInputDeviceId: string | undefined;
  audioOutputDeviceId: string | undefined;
  videoInputDeviceId: string | undefined;

  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setAudioOutputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setVideoInputDeviceId: Dispatch<SetStateAction<string | undefined>>;

  localTracks: {audio: MediaStreamTrack | undefined, video: MediaStreamTrack | undefined};
  setLocalTracks: Dispatch<SetStateAction<{audio: MediaStreamTrack | undefined, video: MediaStreamTrack | undefined}>>;

  sendNotification: (message: {body: string}) => void;
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
  localTracks: { audio: undefined, video: undefined },
  setLocalTracks: (
    value: React.SetStateAction<{
      audio: MediaStreamTrack | undefined;
      video: MediaStreamTrack | undefined;
    }>
  ) => {},
  sendNotification: (message: {body: string}) => {},
});

export { TelnyxMeetContext };
