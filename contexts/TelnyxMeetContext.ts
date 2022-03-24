import { NetworkMetrics } from '@telnyx/video';
import React, { Dispatch, SetStateAction } from 'react';

import { TelnyxRoom } from 'hooks/room';

const TelnyxMeetContext = React.createContext<{
  audioInputDeviceId: string | undefined;
  audioOutputDeviceId: string | undefined;
  videoInputDeviceId: string | undefined;
  networkMetrics: NetworkMetrics | undefined;
  readMessages: any;

  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setAudioOutputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setVideoInputDeviceId: Dispatch<SetStateAction<string | undefined>>;

  localTracks: {
    audio: MediaStreamTrack | undefined;
    video: MediaStreamTrack | undefined;
  };
  setLocalTracks: Dispatch<
    SetStateAction<{
      audio: MediaStreamTrack | undefined;
      video: MediaStreamTrack | undefined;
    }>
  >;
  setNetworkMetrics: Dispatch<SetStateAction<NetworkMetrics | undefined>>;

  sendNotification: (message: { body: string }) => void;
  setReadMessages: Dispatch<SetStateAction<TelnyxRoom['messages']>>;
}>({
  audioInputDeviceId: undefined,
  audioOutputDeviceId: undefined,
  videoInputDeviceId: undefined,
  networkMetrics: undefined,
  readMessages: undefined,

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
  setNetworkMetrics: (
    value: React.SetStateAction<NetworkMetrics | undefined>
  ) => {},
  sendNotification: (message: { body: string }) => {},
  setReadMessages: (value: React.SetStateAction<TelnyxRoom['messages']>) => {},
});

export { TelnyxMeetContext };
