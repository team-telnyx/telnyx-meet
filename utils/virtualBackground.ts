import {
  GpuBuffer,
  Results,
  ResultsListener,
  SelfieSegmentation,
} from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';

const url =
  'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation_solution_simd_wasm_bin.js';

// Create the segmentation selfie instance
//@ts-ignore
let selfieSegmentation: SelfieSegmentation | undefined = undefined;
if (typeof window !== 'undefined') {
  selfieSegmentation = initSelfieSegmentation();
}

function scriptExists(url: string) {
  if (typeof window !== 'undefined') {
    return document.querySelectorAll(`script[src="${url}"]`).length > 0;
  }
  return false;
}

function initSelfieSegmentation() {
  if (scriptExists(url)) {
    return;
  }

  const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    },
  });

  selfieSegmentation.setOptions({
    modelSelection: 1,
  });

  return selfieSegmentation;
}

function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
}

function drawSegmentationMask(
  ctx: CanvasRenderingContext2D,
  segmentation: GpuBuffer,
  width: number,
  height: number
) {
  ctx.drawImage(segmentation, 0, 0, width, height);
}

function blurBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  image: HTMLImageElement | GpuBuffer,
  blurAmount: number = 0
) {
  ctx.globalCompositeOperation = 'destination-over';
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(image, 0, 0, width, height);
}

function drawBackgroundImage(
  results: Results,
  {
    canvasElement,
    canvasContext,
    selectedBackgroundImage,
    blurredEnabled,
    virtualBackgroundEnabled,
    blurAmount,
  }: {
    canvasElement: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    selectedBackgroundImage?: HTMLImageElement;
    blurredEnabled?: boolean;
    virtualBackgroundEnabled?: boolean;
    blurAmount?: number;
  }
) {
  if (!canvasContext) {
    return;
  }
  clearCanvas(canvasContext, canvasElement.width, canvasElement.height);

  canvasContext.globalCompositeOperation = 'copy';
  canvasContext.filter = 'none';

  // Appliyng selfie segmentation - drawing a red mark in human shape from video
  drawSegmentationMask(
    canvasContext,
    results.segmentationMask,
    canvasElement.width,
    canvasElement.height
  );

  canvasContext.globalCompositeOperation = 'source-in';
  canvasContext.filter = 'none';

  //Drawing the human shape in video without background image
  canvasContext.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  //Drawing the background image in video with human shape video overlaping
  if (virtualBackgroundEnabled && selectedBackgroundImage) {
    blurBackground(
      canvasContext,
      canvasElement.width,
      canvasElement.height,
      selectedBackgroundImage,
      0
    );
  }

  //Drawing the background blured in video with human shape video overlaping
  if (blurredEnabled) {
    blurBackground(
      canvasContext,
      canvasElement.width,
      canvasElement.height,
      results.image,
      12
    );
  }

  canvasContext.restore();
}

// This is the callback we invoke on the segmentation result
function handleSegmentationResults(
  results: Results,
  {
    canvasElement,
    canvasContext,
    selectedBackgroundImage,
    blurredEnabled,
    virtualBackgroundEnabled,
    blurAmount,
  }: {
    canvasElement: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    selectedBackgroundImage?: HTMLImageElement;
    blurredEnabled?: boolean;
    virtualBackgroundEnabled?: boolean;
    blurAmount?: number;
  }
) {
  if (selectedBackgroundImage) {
    selectedBackgroundImage.onload = function () {
      drawBackgroundImage(results, {
        canvasElement,
        canvasContext,
        selectedBackgroundImage,
        blurredEnabled,
        virtualBackgroundEnabled,
        blurAmount,
      });
    };

    if (selectedBackgroundImage.complete) {
      drawBackgroundImage(results, {
        canvasElement,
        canvasContext,
        selectedBackgroundImage,
        blurredEnabled,
        virtualBackgroundEnabled,
        blurAmount,
      });
    }
  } else {
    drawBackgroundImage(results, {
      canvasElement,
      canvasContext,
    });
  }
}

export function createVirtualBackgroundStream({
  stream,
  videoElementId,
  blurredEnabled,
  blurAmount = 10,
  virtualBackgroundEnabled,
  image,
  frameRate = 30,
}: {
  stream: MediaStream;
  videoElementId: string;
  blurredEnabled?: boolean;
  blurAmount?: number;
  virtualBackgroundEnabled?: boolean;
  image?: HTMLImageElement;
  frameRate?: number;
}): Promise<{ backgroundCamera: Camera | null; canvasStream: MediaStream }> {
  return new Promise(async (resolve, reject) => {
    let canvasStream: MediaStream = stream;

    if (!blurredEnabled && !virtualBackgroundEnabled) {
      throw new Error(
        'You should enable blur OR virtual background image effect to works'
      );
    }

    if (virtualBackgroundEnabled && !image) {
      throw new Error(
        'You should provide a image element to apply in virtual background image effect'
      );
    }

    if (!document) {
      return resolve({ backgroundCamera: null, canvasStream: canvasStream });
    }

    let canvasElement = document.getElementById('canvas') as HTMLCanvasElement;

    if (!canvasElement) {
      return resolve({ backgroundCamera: null, canvasStream: canvasStream });
    }

    let canvasContext = canvasElement.getContext(
      '2d'
    ) as CanvasRenderingContext2D;

    let width = 640,
      height = 360;

    if (!videoElementId) {
      return resolve({ backgroundCamera: null, canvasStream: canvasStream });
    }

    const videoElement = document.getElementById(
      videoElementId
    ) as HTMLVideoElement;

    if (!videoElement) {
      return resolve({ backgroundCamera: null, canvasStream: canvasStream });
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

    if (!selfieSegmentation) {
      return resolve({ backgroundCamera: null, canvasStream: canvasStream });
    }

    selfieSegmentation.onResults((results: Results) =>
      handleSegmentationResults(results, {
        canvasElement,
        canvasContext,
        selectedBackgroundImage: image,
        blurredEnabled,
        virtualBackgroundEnabled,
        blurAmount,
      })
    );

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        if (selfieSegmentation) {
          await selfieSegmentation.send({
            image: videoElement,
          });
        }
      },
      width: width,
      height: height,
    });

    canvasStream = canvasElement.captureStream(frameRate);

    resolve({ backgroundCamera: camera, canvasStream: canvasStream });
  });
}
