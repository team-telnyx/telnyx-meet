import { MutableRefObject } from 'react';

import { VideoProcessor, Camera } from '@telnyx/video-processors';

export interface VirtualBackground {
  videoProcessor: MutableRefObject<VideoProcessor | null>;
  camera: MutableRefObject<Camera | null>;
  videoElementId: string;
  canvasElementId: string;
  backgroundValue: string;
}

export const addVirtualBackgroundStream = async ({
  videoProcessor,
  camera,
  videoElementId,
  canvasElementId,
  backgroundValue,
}: VirtualBackground): Promise<MediaStreamTrack | undefined> => {
  if (!videoElementId || !canvasElementId || !videoProcessor || !camera) {
    console.error('Failed to set virtual background');
    return undefined;
  }

  if (!backgroundValue || backgroundValue === 'none') {
    await camera.current?.stop();
    if (videoProcessor.current) {
      await videoProcessor.current?.stop();
      videoProcessor.current = null;
    }
    camera.current = null;

    return undefined;
  } else if (backgroundValue !== 'blur') {
    // We use this image as our virtual background
    const image = new Image(996, 664);
    image.src = `//localhost:3000/${backgroundValue}`;
    if (!videoProcessor.current) {
      videoProcessor.current = new VideoProcessor();
    }

    if (camera.current) {
      await camera.current?.stop();
    }

    const virtualBackground =
      await videoProcessor.current.createVirtualBackgroundStream({
        videoConfiguration: true,
        videoElementId,
        canvasElementId,
        image,
        frameRate: 20,
      });

    virtualBackground?.camera?.start();
    camera.current = virtualBackground.camera;

    return virtualBackground.canvasStream.getVideoTracks()[0];
  } else {
    if (!videoProcessor.current) {
      videoProcessor.current = new VideoProcessor();
    }

    if (camera.current) {
      await camera.current?.stop();
    }

    const gaussianBlur =
      await videoProcessor.current.createGaussianBlurBackgroundStream({
        videoConfiguration: true,
        videoElementId,
        canvasElementId,
        frameRate: 20,
      });

    gaussianBlur?.camera?.start();
    camera.current = gaussianBlur.camera;

    return gaussianBlur.canvasStream.getVideoTracks()[0];
  }
};
