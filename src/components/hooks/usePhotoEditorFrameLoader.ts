import { useEffect } from "react";
import { fabric } from "fabric";
import { FrameType, frameAssets, frameDimensions } from "@/assets/frames";
import { Division } from "@/constants/divisions";

export function usePhotoEditorFrameLoader({
  canvas,
  frameType,
  userImage,
  divisionName,
  setImgNaturalSize,
  setUserImageObj,
  setFrameImageObj,
  getCanvasDisplaySize,
}: {
  canvas: fabric.Canvas | null;
  frameType: FrameType;
  userImage: string | null;
  divisionName: Division | "";
  setImgNaturalSize: (s: { width: number; height: number }) => void;
  setUserImageObj: (u: fabric.Image | null) => void;
  setFrameImageObj: (f: fabric.Image | null) => void;
  getCanvasDisplaySize: () => { width: number; height: number };
}) {
  useEffect(() => {
    if (!(canvas && userImage)) return;

    // Clear canvas
    canvas.getObjects().forEach((obj) => canvas.remove(obj));

    const { width: viewW, height: viewH } = getCanvasDisplaySize();
    // Add cache-busting query parameter to force fresh frame loads
    const baseFrameUrl = frameAssets[frameType].bottom;
    const frameUrl = baseFrameUrl.includes('?') 
      ? `${baseFrameUrl}&t=${Date.now()}` 
      : `${baseFrameUrl}?t=${Date.now()}`;

    // 1. Add white background as the very bottom layer
    const whiteRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: viewW,
      height: viewH,
      fill: 'white',
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
    });
    canvas.add(whiteRect);
    canvas.sendToBack(whiteRect);
    console.log('Added white background');

    // Calculate aspect ratios
    // We'll load the blurred image first, then the main image
    fabric.Image.fromURL(userImage, (img) => {
      if (!img) return;
      setImgNaturalSize({ width: img.width!, height: img.height! });
      const imgAspect = img.width! / img.height!;
      const frameAspect = viewW / viewH;
      let scale;
      if (imgAspect > frameAspect) {
        scale = viewW / img.width!;
        if (img.height! * scale < viewH) scale = viewH / img.height!;
      } else {
        scale = viewH / img.height!;
        if (img.width! * scale < viewW) scale = viewW / img.width!;
      }
      scale *= 1.05;

      if (imgAspect < frameAspect) {
        // 2. Always add blurred duplicate image behind main image
        fabric.Image.fromURL(userImage, (bgImg) => {
          if (!bgImg) return;
          const bgScale = Math.max(viewW / bgImg.width!, viewH / bgImg.height!) * 1.2;
          bgImg.set({
            left: viewW / 2,
            top: viewH / 2,
            originX: 'center',
            originY: 'center',
            scaleX: bgScale,
            scaleY: bgScale,
            opacity: 0.5, // 50% opacity
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            hasControls: false,
            hasBorders: false,
          });
          bgImg.filters = [new fabric.Image.filters.Blur({ blur: 8.0 })];
          bgImg.applyFilters();
          canvas.add(bgImg);
          canvas.sendToBack(bgImg);
          console.log('Force-added blurred duplicate image behind main image', bgImg);
          // 3. Add the main interactive image after blurred bg is added
          img.set({
            scaleX: scale,
            scaleY: scale,
            originX: "center",
            originY: "center",
            left: viewW / 2,
            top: viewH / 2,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            lockRotation: true,
            cornerColor: "hsl(262, 83%, 58%)",
            cornerStrokeColor: "white",
            transparentCorners: false,
            cornerSize: 10,
            minScaleLimit: scale * 0.95,
            hoverCursor: 'move',
            moveCursor: 'move',
          });
          canvas.add(img);
          setUserImageObj(img);
          // 4. Add frame overlay on top
          fabric.Image.fromURL(frameUrl, (overlayImg) => {
            overlayImg.set({
              scaleX: viewW / overlayImg.width!,
              scaleY: viewH / overlayImg.height!,
              originX: "left",
              originY: "top",
              left: 0,
              top: 0,
              selectable: false,
              evented: false,
              excludeFromExport: false,
              skipTargetFind: true,
            });
            canvas.add(overlayImg);
            canvas.bringToFront(overlayImg);
            setFrameImageObj(overlayImg);
            
            // Wait for font to load, then add division text with white background
            if (divisionName) {
              document.fonts.ready.then(() => {
                addDivisionText(canvas, viewW, viewH, divisionName);
                canvas.renderAll();
              }).catch(() => {
                // Fallback if font loading fails
                addDivisionText(canvas, viewW, viewH, divisionName);
                canvas.renderAll();
              });
            } else {
              canvas.renderAll();
            }
            
            console.log('Added frame overlay');
          }, { crossOrigin: "anonymous" });
        }, { crossOrigin: 'anonymous' });
      } else {
        // If not too short, just add the main image and frame
        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: "center",
          originY: "center",
          left: viewW / 2,
          top: viewH / 2,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockRotation: true,
          cornerColor: "hsl(262, 83%, 58%)",
          cornerStrokeColor: "white",
          transparentCorners: false,
          cornerSize: 10,
          minScaleLimit: scale * 0.95,
          hoverCursor: 'move',
          moveCursor: 'move',
        });
        canvas.add(img);
        setUserImageObj(img);
        fabric.Image.fromURL(frameUrl, (overlayImg) => {
          overlayImg.set({
            scaleX: viewW / overlayImg.width!,
            scaleY: viewH / overlayImg.height!,
            originX: "left",
            originY: "top",
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            skipTargetFind: true,
          });
          canvas.add(overlayImg);
          canvas.bringToFront(overlayImg);
          setFrameImageObj(overlayImg);
          
          // Wait for font to load, then add division text with white background
          if (divisionName) {
            document.fonts.ready.then(() => {
              addDivisionText(canvas, viewW, viewH, divisionName);
              canvas.renderAll();
            }).catch(() => {
              // Fallback if font loading fails
              addDivisionText(canvas, viewW, viewH, divisionName);
              canvas.renderAll();
            });
          } else {
            canvas.renderAll();
          }
          
          console.log('Added frame overlay');
        }, { crossOrigin: "anonymous" });
      }
    }, { crossOrigin: 'anonymous' });
  }, [canvas, frameType, userImage, divisionName]);
}

// Helper function to add division text with white background
function addDivisionText(canvas: fabric.Canvas, viewW: number, viewH: number, divisionName: Division | "") {
  // Use Anek Malayalam font
  const fontFamily = 'Anek Malayalam, sans-serif';
  
  // Create "Division:" label text (smaller, olive/greyish-green)
  const labelText = new fabric.Text('Division:', {
    fontSize: Math.max(viewW * 0.018, 10), // Reduced font size, minimum 10px
    fontFamily: fontFamily,
    fontWeight: '500',
    fill: '#6B7A5F', // Olive/greyish-green color (matches sample)
    originX: 'center',
    originY: 'top',
    textAlign: 'center',
  });

  // Create division name text (larger, teal/bluish-green)
  const divisionText = new fabric.Text(divisionName, {
    fontSize: Math.max(viewW * 0.030, 14), // Reduced font size, minimum 14px
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
    const divisionMetrics = tempCtx.measureText(divisionName);
    
    // Use measured widths for accurate sizing
    const labelWidth = labelMetrics.width;
    const divisionWidth = divisionMetrics.width;
    const labelHeight = labelText.fontSize! * 1.2; // Approximate line height
    const divisionHeight = divisionText.fontSize! * 1.2;
    
    // Calculate dimensions for white background with padding (horizontal layout)
    // Reduced padding by 50%
    const padding = Math.max(viewW * 0.0175, 5); // Minimum 5px padding, or 1.75% of width (50% reduction)
    const textGap = viewW * 0.015; // Gap between label and division text (horizontal)
    const groupWidth = labelWidth + divisionWidth + (padding * 2) + textGap;
    const groupHeight = Math.max(labelHeight, divisionHeight) + (padding * 2);

    // Create white background rectangle with 15px corner radius - 90% opacity
    const bgRect = new fabric.Rect({
      width: groupWidth,
      height: groupHeight,
      fill: 'rgba(255, 255, 255, 0.9)', // White with 90% opacity
      originX: 'center',
      originY: 'top',
      rx: 15, // 15px corner radius
      ry: 15,
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
    const bottomMargin = viewH * 0.20; // 20% from bottom
    const textGroup = new fabric.Group([bgRect, labelText, divisionText], {
      left: viewW / 2, // Center horizontally (middle of canvas)
      top: viewH - bottomMargin, // Position from bottom
      originX: 'center', // Group's center point is at left position
      originY: 'bottom', // Group's bottom point is at top position
      selectable: false,
      evented: false,
    });

    // Add group to canvas and bring to front (above frame)
    canvas.add(textGroup);
    canvas.bringToFront(textGroup);
  }
}
