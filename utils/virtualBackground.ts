import {
  ResultsListener,
  SelfieSegmentation,
} from '@mediapipe/selfie_segmentation';
// We use this image as our virtual background

// This is the callback we invoke on the segmentation result

function handleSegmentationResults(
  results: any,
  { canvasElement, canvasContext }
) {
  if (!canvasContext) {
    return;
  }
  const image = new Image(996, 664);

  image.src = 'http://localhost:3000/mansao.webp';
  image.onload = function () {
    // At this point, the image is fully loaded
    // So do your thing!
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
  };
}

function getSelfieSegmentation({ canvasElement, canvasContext }) {
  const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    },
  });

  selfieSegmentation.setOptions({
    modelSelection: 1,
  });

  selfieSegmentation.onResults((results) =>
    handleSegmentationResults(results, { canvasElement, canvasContext })
  );
  return selfieSegmentation;
}

//

export function createVirtualBackgroundStream(
  stream: MediaStream,
  videoElementId: string
): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    let canvasStream: MediaStream = stream;

    if (!document) {
      return resolve(stream);
    }

    let canvasElement = document.getElementById('canvas') as HTMLCanvasElement;

    if (!canvasElement) {
      return resolve(stream);
    }

    let canvasContext = canvasElement.getContext('2d');

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

    videoElement.addEventListener('playing', function () {
      if (
        width !== videoElement.videoWidth ||
        height !== videoElement.videoHeight
      ) {
        width = videoElement.videoWidth;
        height = videoElement.videoHeight;
      }
      canvasElement.width = width;
      canvasElement.height = height;

      // Draw the video element on top of the canvas
      let lastTime = 0;
      async function getFrames() {
        const now = videoElement.currentTime;
        if (now > lastTime) {
          await getSelfieSegmentation({ canvasElement, canvasContext }).send({
            image: videoElement,
          });
          lastTime = now;
          requestAnimationFrame(getFrames);
        }
      }
      getFrames();
      // Capture the canvas as a local MediaStream

      canvasStream = canvasElement.captureStream();
      // canvasStream.addTrack(stream.getAudioTracks()[0]);
      resolve(canvasStream);
    });
    resolve(canvasStream);
  });
}
