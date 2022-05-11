import { Stream } from '@telnyx/video';
import React, { useRef, useEffect } from 'react';
import { useState } from 'react';

export default function VideoTrack({
  id,
  stream,
  mirrorVideo,
  dataTestId,
  isPresentation,
}: {
  id: string;
  stream: Stream;
  mirrorVideo: boolean;
  dataTestId: string;
  isPresentation: boolean;
}) {
  const [isPortrait, setIsPortrait] = useState(false);
  const videoElRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoElRef.current;

    if (!videoEl || !stream?.videoTrack) {
      return;
    }

    setIsPortrait(
      stream.videoTrack.getSettings().height! >
        stream.videoTrack.getSettings().width!
    );

    videoEl.srcObject = new MediaStream([stream.videoTrack]);

    return function cleanup() {
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [stream?.videoTrack]);

  return (
    <div
      style={{
        height: '100%',
      }}
    >
      <canvas
        style={{
          transform: mirrorVideo ? 'scaleX(-1)' : 'unset',
          visibility: 'visible',
          height: '100%',
          width: '100%',
          objectFit: isPortrait || isPresentation ? 'contain' : 'cover',
          position: 'absolute',
          zIndex: 1,
        }}
        id='canvas'
        width={250}
        height={80}
      ></canvas>
      <video
        id={id}
        data-testid={dataTestId}
        ref={videoElRef}
        playsInline={true}
        autoPlay={true}
        muted={true}
        style={{
          transform: mirrorVideo ? 'scaleX(-1)' : 'unset',
          visibility: 'visible',
          height: '100%',
          width: '100%',
          objectFit: isPortrait || isPresentation ? 'contain' : 'cover',
        }}
        width={250}
        height={80}
      />
    </div>
  );
}
