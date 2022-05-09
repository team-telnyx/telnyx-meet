import {
  ResultsListener,
  SelfieSegmentation,
} from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';

function drawBackgroundImage(
  results: any,
  {
    canvasElement,
    canvasContext,
    image,
  }: {
    canvasElement: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    image: HTMLImageElement;
  }
) {
  if (!canvasContext) {
    return;
  }
  // At this point, the image is fully loaded
  // Prepare the new frame
  canvasContext.save();
  canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasContext.drawImage(
    results.segmentationMask,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  // Draw the image as the new background, and the segmented video on top of that
  canvasContext.globalCompositeOperation = 'source-out';
  canvasContext.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  canvasContext.globalCompositeOperation = 'destination-atop';
  canvasContext.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  // Done
  canvasContext.restore();
}

// This is the callback we invoke on the segmentation result
function handleSegmentationResults(
  results: any,
  {
    canvasElement,
    canvasContext,
    image,
  }: {
    canvasElement: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    image: HTMLImageElement;
  }
) {
  image.onload = function () {
    drawBackgroundImage(results, {
      canvasElement,
      canvasContext,
      image,
    });
  };

  if (image.complete) {
    drawBackgroundImage(results, {
      canvasElement,
      canvasContext,
      image,
    });
  }
}

function getSelfieSegmentation({
  canvasElement,
  canvasContext,
  image,
}: {
  canvasElement: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  image: HTMLImageElement;
}) {
  const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    },
  });

  selfieSegmentation.setOptions({
    modelSelection: 1,
  });

  selfieSegmentation.onResults((results) =>
    handleSegmentationResults(results, { canvasElement, canvasContext, image })
  );
  selfieSegmentation.initialize();
  return selfieSegmentation;
}

export function createVirtualBackgroundStream(
  stream: MediaStream,
  videoElementId: string
): Promise<MediaStream> {
  return new Promise(async (resolve, reject) => {
    let canvasStream: MediaStream = stream;

    if (!document) {
      return resolve(stream);
    }

    let canvasElement = document.getElementById('canvas') as HTMLCanvasElement;

    if (!canvasElement) {
      return resolve(stream);
    }

    let canvasContext = canvasElement.getContext(
      '2d'
    ) as CanvasRenderingContext2D;

    let width = 640,
      height = 360;

    if (!videoElementId) {
      return resolve(stream);
    }

    const videoElement = document.getElementById(
      videoElementId
    ) as HTMLVideoElement;

    if (!videoElement) {
      return resolve(stream);
    }

    if (
      width !== videoElement.videoWidth ||
      height !== videoElement.videoHeight
    ) {
      width = videoElement.videoWidth;
      height = videoElement.videoHeight;
    }
    canvasElement.width = width;
    canvasElement.height = height;

    // We use this image as our virtual background
    const image = new Image(996, 664);
    image.src = '//localhost:3000/mansao.webp';

    const selfieSegmentation = await getSelfieSegmentation({
      canvasElement,
      canvasContext,
      image,
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await selfieSegmentation.send({
          image: videoElement,
        });
      },
      width: width,
      height: height,
    });
    camera.start();

    canvasStream = canvasElement.captureStream();
    resolve(canvasStream);
  });
}
