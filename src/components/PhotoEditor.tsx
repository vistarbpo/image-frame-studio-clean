import { usePhotoEditorCanvas } from "@/components/hooks/usePhotoEditorCanvas";
import { PhotoEditorControls } from "@/components/PhotoEditorControls";
import { FrameType } from "@/assets/frames";
import { Division } from "@/constants/divisions";

export interface PhotoEditorProps {
  frameType: FrameType;
  userImage: string;
  divisionName: Division | "";
  onBack: () => void;
}

export function PhotoEditor({ frameType, userImage, divisionName, onBack }: PhotoEditorProps) {
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
    divisionName,
  });

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      {/* Canvas container */}
      <div
        className="w-full max-w-md mb-8 relative group"
        style={mobileMarginStyle}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
        <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-0 border border-border/50 shadow-2xl overflow-hidden w-full">
          <div className="w-full" style={{ position: 'relative', width: '100%' }}>
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
              style={{ display: 'block', maxWidth: '100%', height: 'auto', width: '100%' }}
            />
          </div>
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
