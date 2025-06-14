import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { FrameType, frameDimensions, frameAssets } from "@/assets/frames";
import { usePhotoEditorFrameLoader } from "./usePhotoEditorFrameLoader";
import { zoomIn, zoomOut, resetPosition } from "./photoEditorUtils";

function getMobileMargin() {
  if (typeof window !== "undefined" && window.innerWidth <= 600) return 20;
  return 0;
}

// Track touch points for pinch zoom
interface Touch {
  x: number;
  y: number;
  id: number;
}

interface TouchState {
  touches: Touch[];
  lastDistance: number | null;
}

export function usePhotoEditorCanvas({
  frameType,
  userImage,
}: {
  frameType: FrameType;
  userImage: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [userImageObj, setUserImageObj] = useState<fabric.Image | null>(null);
  const [frameImageObj, setFrameImageObj] = useState<fabric.Image | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const touchStateRef = useRef<TouchState>({ touches: [], lastDistance: null });

  // Calculate canvas size based on frame ratio and device width
  const getCanvasDisplaySize = () => {
    const margin = getMobileMargin();
    const deviceWidth = Math.min(typeof window !== "undefined" ? window.innerWidth - margin * 2 : 500, 500);
    const ratio = frameDimensions[frameType];
    const aspectRatio = ratio.height / ratio.width;
    return { width: deviceWidth, height: deviceWidth * aspectRatio };
  };

  // Handle mouse wheel zoom
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

    // Calculate new zoom level
    if (delta > 0) {
      zoomLevel *= 0.95; // Zoom out
    } else {
      zoomLevel *= 1.05; // Zoom in
    }

    // Clamp zoom level
    zoomLevel = Math.min(Math.max(zoomLevel, minZoom), maxZoom);

    // Apply zoom
    userImageObj.scale(zoomLevel);

    // Calculate the position to keep the pointer position fixed
    const scaleFactor = zoomLevel / (userImageObj.scaleX || 1);
    const dx = point.x - userImageObj.left!;
    const dy = point.y - userImageObj.top!;
    
    userImageObj.set({
      left: userImageObj.left! + dx * (1 - scaleFactor),
      top: userImageObj.top! + dy * (1 - scaleFactor)
    });

    canvas.renderAll();
  };

  // Handle touch events for pinch zoom
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

    // Calculate the distance between two fingers
    const currentDistance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY
    );

    if (touchStateRef.current.lastDistance !== null) {
      const delta = currentDistance - touchStateRef.current.lastDistance;
      const zoomFactor = delta > 0 ? 1.02 : 0.98;

      // Calculate center point between fingers
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

      // Clamp zoom level
      const minZoom = 0.1;
      const maxZoom = 5;
      newScaleX = Math.min(Math.max(newScaleX, minZoom), maxZoom);
      newScaleY = Math.min(Math.max(newScaleY, minZoom), maxZoom);

      // Apply zoom around center point
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

  // Always update preview canvas size if frame changes or window resizes
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
  }, [frameType, canvas]);

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

    // Add event listeners
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
  }, [frameType]);

  // Frame and image loader logic
  usePhotoEditorFrameLoader({
    canvas,
    frameType,
    userImage,
    setImgNaturalSize,
    setUserImageObj,
    setFrameImageObj,
    getCanvasDisplaySize,
  });

  // Download high quality image using original upload width
  const downloadImage = async () => {
    if (!canvas || !userImageObj || !imgNaturalSize.width) return;
    setIsDownloading(true);

    try {
      // Calculate optimal export dimensions based on frame type
      const { width: exportW, height: exportH } = (() => {
        // Calculate base size optimized for WhatsApp sharing
        if (frameType === 'square') {
          return {
            width: 1800,
            height: 1800
          };
        } else if (frameType === 'horizontal') {
          return {
            width: 2000,
            height: 1500
          };
        } else { // vertical
          return {
            width: 1500,
            height: 2000
          };
        }
      })();

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportW;
      exportCanvas.height = exportH;
      const exportFabric = new fabric.Canvas(exportCanvas, {
        width: exportW,
        height: exportH,
        backgroundColor: "#000",
        preserveObjectStacking: true
      });

      await new Promise<void>((resolve, reject) => {
        try {
          fabric.Image.fromURL(userImage, (img) => {
            if (!img) {
              reject(new Error("Failed to load user image"));
              return;
            }

            try {
              // Get the current image state
              const currentScale = userImageObj.scaleX || 1;
              const currentLeft = userImageObj.left || 0;
              const currentTop = userImageObj.top || 0;
              const canvasWidth = canvas.width || 1;
              const canvasHeight = canvas.height || 1;

              // Calculate relative position (as percentage of canvas size)
              const relativeLeft = (currentLeft - canvasWidth / 2) / canvasWidth;
              const relativeTop = (currentTop - canvasHeight / 2) / canvasHeight;

              // Calculate scale ratio between preview and export canvas
              const scaleRatio = Math.min(
                exportW / canvasWidth,
                exportH / canvasHeight
              );

              // Calculate new scale that preserves the zoom level
              const exportScale = currentScale * scaleRatio;

              // Calculate new position in export canvas
              const exportLeft = exportW / 2 + (relativeLeft * exportW);
              const exportTop = exportH / 2 + (relativeTop * exportH);

              // Apply the calculated transformations
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

              // Load and position the frame overlay
              fabric.Image.fromURL(
                frameAssets[frameType].bottom,
                (overlayImg) => {
                  if (!overlayImg) {
                    reject(new Error("Failed to load frame overlay"));
                    return;
                  }

                  try {
                    overlayImg.set({
                      scaleX: exportW / (overlayImg.width || 1),
                      scaleY: exportH / (overlayImg.height || 1),
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

                    // Export as JPEG with optimal quality for WhatsApp
                    const jpegQuality = 0.92; // High quality but still optimized size
                    
                    // Check if we're on iOS
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

                    try {
                      if (isIOS) {
                        // For iOS devices, use a different approach that works across all browsers
                        const dataUrl = exportCanvas.toDataURL('image/jpeg', jpegQuality);
                        if (!dataUrl) {
                          throw new Error("Failed to generate data URL");
                        }

                        const img = new Image();
                        img.src = dataUrl;
                        
                        // Create a new window/tab with the image
                        const newWindow = window.open('');
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head>
                                <title>Download Image</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                  body { 
                                    margin: 0; 
                                    padding: 20px; 
                                    background: #000; 
                                    display: flex; 
                                    flex-direction: column; 
                                    align-items: center;
                                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                  }
                                  img { 
                                    max-width: 100%; 
                                    height: auto;
                                    border-radius: 8px;
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                  }
                                  .instructions { 
                                    color: white; 
                                    text-align: center; 
                                    margin: 20px 0;
                                    line-height: 1.5;
                                  }
                                  .button { 
                                    background: #FF5533; 
                                    color: white; 
                                    border: none; 
                                    padding: 12px 24px; 
                                    border-radius: 24px; 
                                    margin: 20px 0;
                                    cursor: pointer;
                                    font-size: 16px;
                                    font-weight: 600;
                                    box-shadow: 0 2px 8px rgba(255,85,51,0.3);
                                    width: 100%;
                                    max-width: 300px;
                                  }
                                  .button:active {
                                    transform: scale(0.98);
                                  }
                                  .button.secondary {
                                    background: #333;
                                    margin-top: 10px;
                                  }
                                  .buttons-container {
                                    display: flex;
                                    flex-direction: column;
                                    width: 100%;
                                    max-width: 300px;
                                    gap: 10px;
                                  }
                                </style>
                              </head>
                              <body>
                                <img src="${dataUrl}" alt="Your framed image" />
                                <div class="instructions">
                                  <p>Your image is ready!</p>
                                </div>
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
                                      link.download = 'frame-studio-${frameType}-${Date.now()}.jpg';
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
                          // Fallback if window.open fails
                          const link = document.createElement("a");
                          link.href = dataUrl;
                          link.target = "_blank";
                          link.click();
                        }
                      } else {
                        // For other browsers, use the standard download approach
                        const dataUrl = exportCanvas.toDataURL('image/jpeg', jpegQuality);
                        if (!dataUrl) {
                          throw new Error("Failed to generate data URL");
                        }
                        const link = document.createElement("a");
                        link.download = `frame-studio-${frameType}-${Date.now()}.jpg`;
                        link.href = dataUrl;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    } catch (error) {
                      console.error("Error during download:", error);
                      // Fallback to simple image display
                      const dataUrl = exportCanvas.toDataURL('image/jpeg', jpegQuality);
                      if (dataUrl) {
                        const link = document.createElement("a");
                        link.href = dataUrl;
                        link.target = "_blank";
                        link.click();
                      }
                    }

                    setIsDownloading(false);
                    exportFabric.dispose();
                    resolve();
                  } catch (error) {
                    reject(error);
                  }
                },
                { crossOrigin: "anonymous" }
              );
            } catch (error) {
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
      // Show a user-friendly error message
      alert("Sorry, there was an error downloading your image. Please try again.");
    }
  };

  const mobileMarginStyle = {
    margin:
      typeof window !== "undefined" && window.innerWidth <= 600 ? "20px" : undefined,
  };

  return {
    canvasRef,
    zoomIn: () => zoomIn(userImageObj, canvas),
    zoomOut: () => zoomOut(userImageObj, canvas),
    resetPosition: () => resetPosition(userImageObj, canvas),
    downloadImage,
    isDownloading,
    mobileMarginStyle,
  };
}
