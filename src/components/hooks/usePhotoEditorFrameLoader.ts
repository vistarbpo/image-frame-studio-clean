import { useEffect } from "react";
import { fabric } from "fabric";
import { FrameType, frameAssets, frameDimensions } from "@/assets/frames";

export function usePhotoEditorFrameLoader({
  canvas,
  frameType,
  userImage,
  setImgNaturalSize,
  setUserImageObj,
  setFrameImageObj,
  getCanvasDisplaySize,
}: {
  canvas: fabric.Canvas | null;
  frameType: FrameType;
  userImage: string | null;
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
            hasControls: true,
            hasBorders: false,
            lockRotation: true,
            cornerColor: "hsl(262, 83%, 58%)",
            cornerStrokeColor: "white",
            transparentCorners: false,
            cornerSize: 10,
            minScaleLimit: scale * 0.95,
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
            });
            canvas.add(overlayImg);
            canvas.bringToFront(overlayImg);
            setFrameImageObj(overlayImg);
            canvas.renderAll();
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
          hasControls: true,
          hasBorders: false,
          lockRotation: true,
            cornerColor: "hsl(262, 83%, 58%)",
          cornerStrokeColor: "white",
          transparentCorners: false,
          cornerSize: 10,
          minScaleLimit: scale * 0.95,
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
          });
          canvas.add(overlayImg);
          canvas.bringToFront(overlayImg);
          setFrameImageObj(overlayImg);
          canvas.renderAll();
          console.log('Added frame overlay');
        }, { crossOrigin: "anonymous" });
      }
    }, { crossOrigin: 'anonymous' });
  }, [canvas, frameType, userImage]);
}
