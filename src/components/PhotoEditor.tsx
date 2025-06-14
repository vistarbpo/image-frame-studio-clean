import { usePhotoEditorCanvas } from "@/components/hooks/usePhotoEditorCanvas";
import { PhotoEditorControls } from "@/components/PhotoEditorControls";
import { FrameType } from "@/assets/frames";

interface PhotoEditorProps {
  frameType: FrameType;
  userImage: string;
  onBack: () => void;
}

export function PhotoEditor({ frameType, userImage, onBack }: PhotoEditorProps) {
  const {
    canvasRef,
    zoomIn,
    zoomOut,
    resetPosition,
    downloadImage,
    isDownloading,
    mobileMarginStyle
  } = usePhotoEditorCanvas({
    frameType,
    userImage,
  });

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      {/* Canvas container */}
      <div
        className="w-full max-w-md mb-6 bg-black"
        style={mobileMarginStyle}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-auto border border-gray-800 shadow-lg"
        />
      </div>

      {/* Controls */}
      <PhotoEditorControls
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetPosition={resetPosition}
        downloadImage={downloadImage}
        isDownloading={isDownloading}
        onBack={onBack}
      />
    </div>
  );
}
