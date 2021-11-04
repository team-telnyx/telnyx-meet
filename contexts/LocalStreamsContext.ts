import React from 'react';

interface ILocalStreams {
  localAudioTrack: MediaStreamTrack | undefined;
  localVideoTrack: MediaStreamTrack | undefined;
}

const LocalStreamsContext = React.createContext<
  [
    localStreamsState: ILocalStreams,
    setLocalStreamsState: React.SetStateAction<any>
  ]
>([
  {
    localAudioTrack: undefined,
    localVideoTrack: undefined,
  },
  () => {},
]);
export { LocalStreamsContext };
