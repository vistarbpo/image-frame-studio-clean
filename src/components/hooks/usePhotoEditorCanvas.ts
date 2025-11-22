import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { FrameType, frameDimensions, frameAssets } from "@/assets/frames";
import { usePhotoEditorFrameLoader } from "./usePhotoEditorFrameLoader";
import { zoomIn, zoomOut, resetPosition } from "./photoEditorUtils";
import { drawBlurredBackground } from '@/utils/imageOptimizer';
import { Division } from "@/constants/divisions";

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
  divisionName,
}: {
  frameType: FrameType;
  userImage: string;
  divisionName: Division;
}) {
  // Helper function to add division text with white background
  const addDivisionTextToCanvas = (canvas: fabric.Canvas, width: number, height: number, divName: Division) => {
    // Use Anek Malayalam font
    const fontFamily = 'Anek Malayalam, sans-serif';
    
    // Create "Division:" label text (smaller, olive/greyish-green)
    const labelText = new fabric.Text('Division:', {
      fontSize: Math.max(width * 0.018, 10), // Reduced font size, minimum 10px
      fontFamily: fontFamily,
      fontWeight: '500',
      fill: '#6B7A5F', // Olive/greyish-green color (matches sample)
      originX: 'center',
      originY: 'top',
      textAlign: 'center',
    });

    // Create division name text (larger, teal/bluish-green)
    const divisionText = new fabric.Text(divName, {
      fontSize: Math.max(width * 0.030, 14), // Reduced font size, minimum 14px
      fontFamily: fontFamily,
      fontWeight: '700', // Bolder to match sample
      fill: '#2D7A7A', // Teal/bluish-green color (matches sample)
      originX: 'center',
      originY: 'top',
      textAlign: 'center',
    });

    // Measure text dimensions after creation (fabric needs to calculate these)
    // Add text to a temporary canvas to get accurate measurements
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.font = `${labelText.fontWeight} ${labelText.fontSize}px ${labelText.fontFamily}`;
      const labelMetrics = tempCtx.measureText('Division:');
      tempCtx.font = `${divisionText.fontWeight} ${divisionText.fontSize}px ${divisionText.fontFamily}`;
      const divisionMetrics = tempCtx.measureText(divName);
      
      // Use measured widths for accurate sizing
      const labelWidth = labelMetrics.width;
      const divisionWidth = divisionMetrics.width;
      const labelHeight = labelText.fontSize! * 1.2; // Approximate line height
      const divisionHeight = divisionText.fontSize! * 1.2;
      
      // Calculate dimensions for white background with padding (horizontal layout)
      // Reduced padding by 50%
      const padding = Math.max(width * 0.0175, 5); // Minimum 5px padding, or 1.75% of width (50% reduction)
      const textGap = width * 0.015; // Gap between label and division text (horizontal)
      const groupWidth = labelWidth + divisionWidth + (padding * 2) + textGap;
      const groupHeight = Math.max(labelHeight, divisionHeight) + (padding * 2);

      // Scale corner radius proportionally to canvas width to match preview
      // Preview canvas is typically ~500px, export is 1500-2000px
      // So scale radius: 15px * (width / 500) to maintain same visual appearance
      const previewWidth = 500; // Reference preview width
      const cornerRadius = Math.max(15 * (width / previewWidth), 15); // Scale proportionally, minimum 15px

      // Create white background rectangle with scaled corner radius - 90% opacity
      const bgRect = new fabric.Rect({
        width: groupWidth,
        height: groupHeight,
        fill: 'rgba(255, 255, 255, 0.9)', // White with 90% opacity
        originX: 'center',
        originY: 'top',
        rx: cornerRadius, // Scaled corner radius to match preview appearance
        ry: cornerRadius,
      });

      // Position text elements relative to background (horizontal layout)
      const startX = -(groupWidth / 2) + padding;
      labelText.set({
        left: startX + (labelWidth / 2),
        top: padding + (groupHeight - padding * 2) / 2 - labelHeight / 2,
        originX: 'center',
        originY: 'top',
      });

      divisionText.set({
        left: startX + labelWidth + textGap + (divisionWidth / 2),
        top: padding + (groupHeight - padding * 2) / 2 - divisionHeight / 2,
        originX: 'center',
        originY: 'top',
      });

      // Position background at center
      bgRect.set({
        left: 0,
        top: 0,
      });

      // Create text group positioned at bottom center of the frame
      // Position it at 20% from bottom
      const bottomMargin = height * 0.20; // 20% from bottom
      const textGroup = new fabric.Group([bgRect, labelText, divisionText], {
        left: width / 2, // Center horizontally (middle of canvas)
        top: height - bottomMargin, // Position from bottom
        originX: 'center', // Group's center point is at left position
        originY: 'bottom', // Group's bottom point is at top position
        selectable: false,
        evented: false,
      });

      // Add group to canvas and bring to front (above frame)
      canvas.add(textGroup);
      canvas.bringToFront(textGroup);
    }
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [userImageObj, setUserImageObj] = useState<fabric.Image | null>(null);
  const [frameImageObj, setFrameImageObj] = useState<fabric.Image | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const touchStateRef = useRef<TouchState>({ touches: [], lastDistance: null });

  // Calculate canvas size based on frame ratio and container width
  const getCanvasDisplaySize = () => {
    const margin = getMobileMargin();
    // max-w-md = 28rem = 448px, account for container padding/borders
    const maxContainerWidth = 448; // max-w-md in pixels
    const availableWidth = typeof window !== "undefined" 
      ? Math.min(window.innerWidth - margin * 2, maxContainerWidth)
      : maxContainerWidth;
    const ratio = frameDimensions[frameType];
    const aspectRatio = ratio.height / ratio.width;
    return { width: availableWidth, height: availableWidth * aspectRatio };
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
      if (canvas && canvasRef.current) {
        // Get actual container width to ensure canvas fits
        let containerWidth = 448; // Default max-w-md
        const parent = canvasRef.current.parentElement;
        
        if (parent) {
          // Check parent's parent (the container div)
          const container = parent.parentElement;
          if (container) {
            const rect = container.getBoundingClientRect();
            containerWidth = rect.width || 448;
          } else {
            const rect = parent.getBoundingClientRect();
            containerWidth = rect.width || 448;
          }
        } else if (typeof window !== "undefined") {
          // Fallback: use window width with margin
          const margin = getMobileMargin();
          containerWidth = Math.min(window.innerWidth - margin * 2, 448);
        }
        
        // Ensure we don't exceed max-w-md (448px)
        containerWidth = Math.min(containerWidth, 448);
        
        // Calculate canvas size based on container width
        const ratio = frameDimensions[frameType];
        const aspectRatio = ratio.height / ratio.width;
        const canvasWidth = containerWidth;
        const canvasHeight = canvasWidth * aspectRatio;
        
        canvas.setWidth(canvasWidth);
        canvas.setHeight(canvasHeight);
        canvas.calcOffset && canvas.calcOffset();
        canvas.renderAll();
      }
    };
    window.addEventListener("resize", updateCanvasSize);
    // Use a small delay to ensure container is rendered
    const timeoutId = setTimeout(updateCanvasSize, 100);
    updateCanvasSize();
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      clearTimeout(timeoutId);
    };
  }, [frameType, canvas]);

  // Initialize the fabric canvas and event handlers
  useEffect(() => {
    if (!canvasRef.current) return;

    canvas?.dispose();
    
    // Get actual container width to ensure canvas fits
    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      
      let containerWidth = 448; // Default max-w-md
      const parent = canvasRef.current.parentElement;
      
      if (parent) {
        // Check parent's parent (the container div)
        const container = parent.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          containerWidth = rect.width || 448;
        } else {
          const rect = parent.getBoundingClientRect();
          containerWidth = rect.width || 448;
        }
      } else {
        const { width } = getCanvasDisplaySize();
        containerWidth = width;
      }
      
      // Ensure we don't exceed max-w-md (448px)
      containerWidth = Math.min(containerWidth, 448);
      
      // Calculate canvas size based on container width
      const ratio = frameDimensions[frameType];
      const aspectRatio = ratio.height / ratio.width;
      const canvasWidth = containerWidth;
      const canvasHeight = canvasWidth * aspectRatio;

      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
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
    });

    return () => {
      if (canvas) {
        const canvasElement = canvas.getElement();
        canvasElement.removeEventListener("touchstart", handleTouchStart);
        canvasElement.removeEventListener("touchmove", handleTouchMove);
        canvasElement.removeEventListener("touchend", handleTouchEnd);
        canvasElement.removeEventListener("touchcancel", handleTouchEnd);
        canvas.dispose();
      }
    };
  }, [frameType]);

  // Frame and image loader logic
  usePhotoEditorFrameLoader({
    canvas,
    frameType,
    userImage,
    divisionName,
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
      // Add white background as the very first object in export canvas
      const whiteRect = new fabric.Rect({
        left: 0,
        top: 0,
        width: exportW,
        height: exportH,
        fill: 'white',
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'top',
      });
      exportFabric.add(whiteRect);
      exportFabric.insertAt(whiteRect, 0, false);
      // User image
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

              // If image is too short, draw blurred background
              const imgAspect = img.width! / img.height!;
              const frameAspect = exportW / exportH;
              if (imgAspect < frameAspect) {
                const ctx = exportCanvas.getContext('2d');
                if (ctx) {
                  // Draw blurred background with increased blur radius and opacity
                  ctx.globalAlpha = 0.3; // Set opacity for the blurred background
                  drawBlurredBackground(ctx, img.getElement(), exportW, exportH, 96);
                  ctx.globalAlpha = 1.0; // Reset opacity for the main image
                }
              }

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

              // Load and position the frame overlay (with cache-busting)
              const baseFrameUrl = frameAssets[frameType].bottom;
              const frameUrlWithCache = baseFrameUrl.includes('?') 
                ? `${baseFrameUrl}&t=${Date.now()}` 
                : `${baseFrameUrl}?t=${Date.now()}`;
              fabric.Image.fromURL(
                frameUrlWithCache,
                (overlayImg) => {
                  if (!overlayImg) {
                    reject(new Error("Failed to load frame overlay"));
                    return;
                  }

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
                  
                  // Wait for font to load, then add division text and export
                  const addTextAndExport = () => {
                    // Add division text with white background
                    if (divisionName) {
                      addDivisionTextToCanvas(exportFabric, exportW, exportH, divisionName);
                    }
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
                                    background: hsl(262, 83%, 58%); 
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

                      setIsDownloading(false);
                      exportFabric.dispose();
                      resolve();
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
                      setIsDownloading(false);
                      exportFabric.dispose();
                      reject(error);
                    }
                  };

                  // Wait for font to load before adding text and exporting
                  if (divisionName) {
                    document.fonts.ready.then(() => {
                      addTextAndExport();
                    }).catch(() => {
                      // Fallback if font loading fails
                      addTextAndExport();
                    });
                  } else {
                    addTextAndExport();
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
