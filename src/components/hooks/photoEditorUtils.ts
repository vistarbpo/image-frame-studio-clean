
import { fabric } from "fabric";

export function zoomIn(userImageObj: fabric.Image | null, canvas: fabric.Canvas | null) {
  if (!userImageObj) return;
  userImageObj.scaleX! *= 1.1;
  userImageObj.scaleY! *= 1.1;
  canvas?.renderAll();
}

export function zoomOut(userImageObj: fabric.Image | null, canvas: fabric.Canvas | null) {
  if (!userImageObj) return;
  userImageObj.scaleX! *= 0.9;
  userImageObj.scaleY! *= 0.9;
  canvas?.renderAll();
}

export function resetPosition(userImageObj: fabric.Image | null, canvas: fabric.Canvas | null) {
  if (!userImageObj || !canvas) return;
  userImageObj.set({
    left: canvas.width! / 2,
    top: canvas.height!,
  });
  canvas.renderAll();
}
