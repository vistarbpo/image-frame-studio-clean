import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

const FRAME_SRC = "/risala/frame.png";

function getMobileMargin() {
  if (typeof window !== "undefined" && window.innerWidth <= 600) return 20;
  return 0;
}

export function useRisalaPhotoEditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userImageObj, setUserImageObj] = useState<fabric.Image | null>(null);
  const [frameImageObj, setFrameImageObj] = useState<fabric.Image | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const touchStateRef = useRef<{ touches: any[]; lastDistance: number | null }>({ touches: [], lastDistance: null });

  // Calculate canvas size based on frame ratio and device width
  const getCanvasDisplaySize = () => {
    const margin = getMobileMargin();
    const deviceWidth = Math.min(typeof window !== "undefined" ? window.innerWidth - margin * 2 : 500, 500);
    const { width, height } = frameSize.width && frameSize.height ? frameSize : { width: 500, height: 500 };
    const aspectRatio = height / width;
    return { width: deviceWidth, height: deviceWidth * aspectRatio };
  };

  // Mouse wheel zoom
  const handleMouseWheel = (opt: fabric.IEvent<WheelEvent>) => {
    if (!userImageObj || !canvas) return;
    opt.e.preventDefault();
    opt.e.stopPropagation();
    const delta = opt.e.deltaY;
    const pointer = canvas.getPointer(opt.e);
    const point = new fabric.Point(pointer.x, pointer.y);
    let zoomLevel = userImageObj.scaleX || 1;
    const minZoom = 0.1;
    const maxZoom = 5;
    if (delta > 0) {
      zoomLevel *= 0.95;
    } else {
      zoomLevel *= 1.05;
    }
    zoomLevel = Math.min(Math.max(zoomLevel, minZoom), maxZoom);
    userImageObj.scale(zoomLevel);
    const scaleFactor = zoomLevel / (userImageObj.scaleX || 1);
    const dx = point.x - userImageObj.left!;
    const dy = point.y - userImageObj.top!;
    userImageObj.set({
      left: userImageObj.left! + dx * (1 - scaleFactor),
      top: userImageObj.top! + dy * (1 - scaleFactor)
    });
    canvas.renderAll();
  };

  // Pinch zoom
  const handleTouchStart = (e: TouchEvent) => {
    if (!userImageObj || !canvas) return;
    const touches = Array.from(e.touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      id: touch.identifier
    }));
    touchStateRef.current.touches = touches;
    touchStateRef.current.lastDistance = null;
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (!userImageObj || !canvas || e.touches.length !== 2) return;
    e.preventDefault();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY
    );
    if (touchStateRef.current.lastDistance !== null) {
      const delta = currentDistance - touchStateRef.current.lastDistance;
      const zoomFactor = delta > 0 ? 1.02 : 0.98;
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      const canvasRect = canvas.getElement().getBoundingClientRect();
      const pointer = {
        x: (center.x - canvasRect.left) / canvas.getZoom(),
        y: (center.y - canvasRect.top) / canvas.getZoom()
      };
      let newScaleX = (userImageObj.scaleX || 1) * zoomFactor;
      let newScaleY = (userImageObj.scaleY || 1) * zoomFactor;
      const minZoom = 0.1;
      const maxZoom = 5;
      newScaleX = Math.min(Math.max(newScaleX, minZoom), maxZoom);
      newScaleY = Math.min(Math.max(newScaleY, minZoom), maxZoom);
      const dx = pointer.x - userImageObj.left!;
      const dy = pointer.y - userImageObj.top!;
      const scaleFactor = newScaleX / (userImageObj.scaleX || 1);
      userImageObj.set({
        scaleX: newScaleX,
        scaleY: newScaleY,
        left: userImageObj.left! + dx * (1 - scaleFactor),
        top: userImageObj.top! + dy * (1 - scaleFactor)
      });
      canvas.renderAll();
    }
    touchStateRef.current.lastDistance = currentDistance;
  };
  const handleTouchEnd = () => {
    touchStateRef.current.touches = [];
    touchStateRef.current.lastDistance = null;
  };

  // Update canvas size on frame load or window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const { width, height } = getCanvasDisplaySize();
      if (canvas) {
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.calcOffset && canvas.calcOffset();
        canvas.renderAll();
      }
    };
    window.addEventListener("resize", updateCanvasSize);
    updateCanvasSize();
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [frameSize, canvas]);

  // Initialize the fabric canvas and event handlers
  useEffect(() => {
    if (!canvasRef.current) return;
    canvas?.dispose();
    const { width, height } = getCanvasDisplaySize();
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#000",
      preserveObjectStacking: true,
      selection: false,
      renderOnAddRemove: true,
    });
    fabricCanvas.on("mouse:wheel", handleMouseWheel);
    const canvasElement = fabricCanvas.getElement();
    canvasElement.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvasElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvasElement.addEventListener("touchend", handleTouchEnd);
    canvasElement.addEventListener("touchcancel", handleTouchEnd);
    setCanvas(fabricCanvas);
    return () => {
      canvasElement.removeEventListener("touchstart", handleTouchStart);
      canvasElement.removeEventListener("touchmove", handleTouchMove);
      canvasElement.removeEventListener("touchend", handleTouchEnd);
      canvasElement.removeEventListener("touchcancel", handleTouchEnd);
      fabricCanvas.dispose();
    };
  }, [frameSize]);

  // Load frame and user image
  useEffect(() => {
    if (!canvas || !userImage) return;
    canvas.getObjects().forEach((obj) => canvas.remove(obj));
    // Load frame image to get its size
    fabric.Image.fromURL(FRAME_SRC, (frameImg) => {
      if (!frameImg) return;
      setFrameSize({ width: frameImg.width!, height: frameImg.height! });
      setFrameImageObj(frameImg);
      // Load user image
      fabric.Image.fromURL(userImage, (img) => {
        if (!img) return;
        // Fit user image to cover the frame
        const frameW = frameImg.width!;
        const frameH = frameImg.height!;
        const imgAspect = img.width! / img.height!;
        const frameAspect = frameW / frameH;
        let scale;
        if (imgAspect > frameAspect) {
          scale = frameW / img.width!;
          if (img.height! * scale < frameH) {
            scale = frameH / img.height!;
          }
        } else {
          scale = frameH / img.height!;
          if (img.width! * scale < frameW) {
            scale = frameW / img.width!;
          }
        }
        scale *= 1.05;
        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: "center",
          originY: "center",
          left: frameW / 2,
          top: frameH / 2,
          selectable: true,
          hasControls: true,
          hasBorders: false,
          lockRotation: true,
          cornerColor: "#FF5533",
          cornerStrokeColor: "white",
          transparentCorners: false,
          cornerSize: 10,
          minScaleLimit: scale * 0.95,
        });
        canvas.add(img);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.absolutePan(new fabric.Point(0, 0));
        setUserImageObj(img);
        // Add frame overlay
        frameImg.set({
          scaleX: frameW / frameImg.width!,
          scaleY: frameH / frameImg.height!,
          originX: "left",
          originY: "top",
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
        });
        canvas.add(frameImg);
        canvas.bringToFront(frameImg);
        setFrameImageObj(frameImg);
        canvas.renderAll();
      }, { crossOrigin: "anonymous" });
    }, { crossOrigin: "anonymous" });
  }, [canvas, userImage]);

  // Download logic (same as main, but only one frame)
  const downloadImage = async () => {
    if (!canvas || !userImageObj || !frameImageObj) return;
    setIsDownloading(true);
    try {
      const exportW = frameSize.width;
      const exportH = frameSize.height;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportW;
      exportCanvas.height = exportH;
      const exportFabric = new fabric.Canvas(exportCanvas, {
        width: exportW,
        height: exportH,
        backgroundColor: "#000",
        preserveObjectStacking: true
      });
      // User image
      await new Promise<void>((resolve) => {
        fabric.Image.fromURL(userImage, (img) => {
          if (!img) return resolve();
          const currentScale = userImageObj.scaleX || 1;
          const currentLeft = userImageObj.left || 0;
          const currentTop = userImageObj.top || 0;
          const canvasWidth = canvas.width || 1;
          const canvasHeight = canvas.height || 1;
          const relativeLeft = (currentLeft - canvasWidth / 2) / canvasWidth;
          const relativeTop = (currentTop - canvasHeight / 2) / canvasHeight;
          const scaleRatio = Math.min(
            exportW / canvasWidth,
            exportH / canvasHeight
          );
          const exportScale = currentScale * scaleRatio;
          const exportLeft = exportW / 2 + (relativeLeft * exportW);
          const exportTop = exportH / 2 + (relativeTop * exportH);
          img.set({
            scaleX: exportScale,
            scaleY: exportScale,
            originX: "center",
            originY: "center",
            left: exportLeft,
            top: exportTop,
            selectable: false,
            evented: false,
          });
          exportFabric.add(img);
          // Frame overlay
          fabric.Image.fromURL(FRAME_SRC, (overlayImg) => {
            if (!overlayImg) return resolve();
            overlayImg.set({
              scaleX: exportW / overlayImg.width!,
              scaleY: exportH / overlayImg.height!,
              originX: "left",
              originY: "top",
              left: 0,
              top: 0,
              selectable: false,
              evented: false,
            });
            exportFabric.add(overlayImg);
            exportFabric.bringToFront(overlayImg);
            exportFabric.renderAll();
            // Download
            const jpegQuality = 0.92;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            if (isIOS) {
              const dataUrl = exportCanvas.toDataURL('image/jpeg', jpegQuality);
              const img = new Image();
              img.src = dataUrl;
              const newWindow = window.open('');
              if (newWindow) {
                newWindow.document.write(`
                  <html>
                    <head>
                      <title>Download Image</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body { margin: 0; padding: 20px; background: #000; display: flex; flex-direction: column; align-items: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                        img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                        .instructions { color: white; text-align: center; margin: 20px 0; line-height: 1.5; }
                        .button { background: #FF5533; color: white; border: none; padding: 12px 24px; border-radius: 24px; margin: 20px 0; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 2px 8px rgba(255,85,51,0.3); width: 100%; max-width: 300px; }
                        .button:active { transform: scale(0.98); }
                        .button.secondary { background: #333; margin-top: 10px; }
                        .buttons-container { display: flex; flex-direction: column; width: 100%; max-width: 300px; gap: 10px; }
                      </style>
                    </head>
                    <body>
                      <img src="${dataUrl}" alt="Your framed image" />
                      <div class="instructions"><p>Your image is ready!</p></div>
                      <div class="buttons-container">
                        <button class="button" onclick="saveImage()">Save Image</button>
                        <button class="button secondary" onclick="window.close()">Close</button>
                      </div>
                      <script>
                        function saveImage() {
                          const img = document.querySelector('img');
                          if (img) {
                            const link = document.createElement('a');
                            link.href = img.src;
                            link.download = 'risala-framed.jpg';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }
                      </script>
                    </body>
                  </html>
                `);
              } else {
                const link = document.createElement("a");
                link.href = dataUrl;
                link.target = "_blank";
                link.click();
              }
            } else {
              const dataUrl = exportCanvas.toDataURL('image/jpeg', jpegQuality);
              const link = document.createElement("a");
              link.download = 'risala-framed.jpg';
              link.href = dataUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            setIsDownloading(false);
            exportFabric.dispose();
            resolve();
          }, { crossOrigin: "anonymous" });
        }, { crossOrigin: "anonymous" });
      });
    } catch (e) {
      setIsDownloading(false);
      alert("Sorry, there was an error downloading your image. Please try again.");
    }
  };

  const zoomIn = () => {
    if (!userImageObj || !canvas) return;
    userImageObj.scaleX! *= 1.1;
    userImageObj.scaleY! *= 1.1;
    canvas.renderAll();
  };
  const zoomOut = () => {
    if (!userImageObj || !canvas) return;
    userImageObj.scaleX! *= 0.9;
    userImageObj.scaleY! *= 0.9;
    canvas.renderAll();
  };
  const resetPosition = () => {
    if (!userImageObj || !canvas) return;
    userImageObj.set({
      left: canvas.width! / 2,
      top: canvas.height! / 2,
    });
    canvas.renderAll();
  };

  const mobileMarginStyle = {
    margin:
      typeof window !== "undefined" && window.innerWidth <= 600 ? "20px" : undefined,
  };

  return {
    canvasRef,
    userImage,
    setUserImage,
    isDownloading,
    downloadImage,
    zoomIn,
    zoomOut,
    resetPosition,
    mobileMarginStyle,
  };
} 