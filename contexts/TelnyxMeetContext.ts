import { NetworkMetrics } from '@telnyx/video';
import React, { Dispatch, SetStateAction } from 'react';

const TelnyxMeetContext = React.createContext<{
  audioInputDeviceId: string | undefined;
  audioOutputDeviceId: string | undefined;
  videoInputDeviceId: string | undefined;
  setAudioInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setAudioOutputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setVideoInputDeviceId: Dispatch<SetStateAction<string | undefined>>;
  isAudioTrackEnabled: boolean;
  isVideoTrackEnabled: boolean;
  setIsAudioTrackEnabled: Dispatch<SetStateAction<boolean>>;
  setIsVideoTrackEnabled: Dispatch<SetStateAction<boolean>>;
  sendNotification: (message: { body: string }) => void;
  networkMetrics: NetworkMetrics | undefined;
  setNetworkMetrics: Dispatch<SetStateAction<NetworkMetrics | undefined>>;
  optionalFeatures: { [key: string]: boolean };
  error:
    | { type: string; message: { title: string; body: string } }
    | undefined;
  setError: Dispatch<
    SetStateAction<
      { type: string; message: { title: string; body: string } } | undefined
    >
  >;
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
  isAudioTrackEnabled: false,
  isVideoTrackEnabled: false,
  setIsAudioTrackEnabled: (value: React.SetStateAction<boolean>) => {},
  setIsVideoTrackEnabled: (value: React.SetStateAction<boolean>) => {},
  sendNotification: (message: { body: string }) => {},
  networkMetrics: undefined,
  setNetworkMetrics: (
    value: React.SetStateAction<NetworkMetrics | undefined>
  ) => {},
  optionalFeatures: {},
  error: undefined,
  setError: (
    value: React.SetStateAction<
      { type: string; message: { title: string; body: string } } | undefined
    >
  ) => {},
});

export { TelnyxMeetContext };
