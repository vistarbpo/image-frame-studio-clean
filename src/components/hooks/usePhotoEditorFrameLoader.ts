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

    // Remove all objects
    canvas.getObjects().forEach((obj) => canvas.remove(obj));

    // USER IMAGE LOAD
    fabric.Image.fromURL(userImage, (img) => {
      setImgNaturalSize({
        width: img.width!,
        height: img.height!,
      });

      const { width: viewW, height: viewH } = getCanvasDisplaySize();
      
      // Calculate aspect ratios
      const imgAspect = img.width! / img.height!;
      const frameAspect = viewW / viewH;
      
      // Calculate scale to completely fill the frame
      let scale;
      if (imgAspect > frameAspect) {
        // Image is wider - scale to width first
        scale = viewW / img.width!;
        // Check if height is sufficient
        const scaledHeight = img.height! * scale;
        if (scaledHeight < viewH) {
          // If height is not enough, scale to height instead
          scale = viewH / img.height!;
        }
      } else {
        // Image is taller - scale to height first
        scale = viewH / img.height!;
        // Check if width is sufficient
        const scaledWidth = img.width! * scale;
        if (scaledWidth < viewW) {
          // If width is not enough, scale to width instead
          scale = viewW / img.width!;
        }
      }

      // Add a small extra scale to ensure no gaps
      scale *= 1.05;

      // Set initial image properties
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
        cornerColor: "#FF5533",
        cornerStrokeColor: "white",
        transparentCorners: false,
        cornerSize: 10,
        // Set minimum scale to prevent gaps
        minScaleLimit: scale * 0.95,
      });

      canvas.add(img);
      
      // Center the image viewport
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.absolutePan(new fabric.Point(0, 0));
      
      setUserImageObj(img);

      // FRAME OVERLAY LOAD
      const frameUrl = frameAssets[frameType].bottom;
        fabric.Image.fromURL(
          frameUrl,
          (overlayImg) => {
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
          },
          { crossOrigin: "anonymous" }
        );
    });
  }, [canvas, frameType, userImage]);
}
