import { Stream } from '@telnyx/video';
import React, { useRef, useEffect } from 'react';
import { useState } from 'react';

export default function VideoTrack({
  stream,
  mirrorVideo,
  dataTestId,
  isPresentation,
}: {
  stream: Stream;
  mirrorVideo: boolean;
  dataTestId: string;
  isPresentation: boolean;
}) {
  const [isPortrait, setIsPortrait] = useState(false);
  const videoElRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElRefCurrent = videoElRef.current;

    if (!videoElRefCurrent || !stream.videoTrack) {
      return;
    }

    setIsPortrait(
      stream.videoTrack.getSettings().height! >
        stream.videoTrack.getSettings().width!
    );

    videoElRef.current.srcObject = new MediaStream([stream.videoTrack]);

    return function cleanup() {
      if (videoElRefCurrent) {
        videoElRefCurrent.srcObject = null;
      }
    };
  }, [stream.videoTrack]);

  return (
    <div
      style={{
        height: '100%',
      }}
    >
      <video
        data-testid={dataTestId}
        ref={videoElRef}
        playsInline={true}
        autoPlay={true}
        muted={true}
        style={{
          transform: mirrorVideo ? 'scaleX(-1)' : 'unset',
          visibility: stream.isVideoEnabled ? 'visible' : 'hidden',
          height: '100%',
          width: '100%',
          objectFit: isPortrait || isPresentation ? 'contain' : 'cover',
        }}
      />
    </div>
  );
}
