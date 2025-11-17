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
        className="w-full max-w-md mb-8 relative group"
        style={mobileMarginStyle}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
        <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
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
