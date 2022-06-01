import { MutableRefObject } from 'react';

import { VideoProcessor, Camera } from '@telnyx/video-processors';

export interface VirtualBackground {
  videoProcessor: MutableRefObject<VideoProcessor>;
  camera: MutableRefObject<Camera>;
  videoElementId: string;
  canvasElementId: string;
  track: MediaStreamTrack | undefined;
  backgroundValue: string;
}

export const addVirtualBackgroundStream = async ({
  videoProcessor,
  camera,
  videoElementId,
  canvasElementId,
  track,
  backgroundValue,
}: VirtualBackground): Promise<MediaStreamTrack | undefined> => {
  if (
    !videoElementId ||
    !canvasElementId ||
    !track ||
    !videoProcessor ||
    !camera
  ) {
    console.error('Failed to set virtual background');
    return undefined;
  }

  if (!backgroundValue || backgroundValue === 'none') {
    await camera.current?.stop();
    if (videoProcessor.current && videoProcessor.current?.segmentation) {
      await videoProcessor.current?.stop();
      videoProcessor.current = null;
    }
    camera.current = null;

    return undefined;
  } else if (backgroundValue !== 'blur') {
    // We use this image as our virtual background
    const image = new Image(996, 664);
    image.src = `//localhost:3000/${backgroundValue}`;
    if (!videoProcessor.current || !videoProcessor.current?.segmentation) {
      videoProcessor.current = new VideoProcessor();
    }

    if (camera.current) {
      await camera.current?.stop();
    }

    const {
      videoCameraProcessor,
      canvasStream,
    }: { videoCameraProcessor: Camera; canvasStream: MediaStream } =
      await videoProcessor.current.createVirtualBackgroundStream({
        track,
        videoElementId,
        canvasElementId,
        image,
        frameRate: 20,
      });

    videoCameraProcessor.start();
    camera.current = videoCameraProcessor;

    return canvasStream.getVideoTracks()[0];
  } else {
    if (!videoProcessor.current || !videoProcessor.current?.segmentation) {
      videoProcessor.current = new VideoProcessor();
    }

    if (camera.current) {
      await camera.current?.stop();
    }

    const {
      videoCameraProcessor,
      canvasStream,
    }: { videoCameraProcessor: Camera; canvasStream: MediaStream } =
      await videoProcessor.current.createGaussianBlurBackgroundStream({
        track,
        videoElementId,
        canvasElementId,
        frameRate: 20,
      });

    videoCameraProcessor.start();
    camera.current = videoCameraProcessor;

    return canvasStream.getVideoTracks()[0];
  }
};
