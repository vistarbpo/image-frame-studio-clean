
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, Move } from "lucide-react";

interface ControlsProps {
  zoomIn: () => void;
  zoomOut: () => void;
  resetPosition: () => void;
  downloadImage: () => void;
  isDownloading: boolean;
  onBack: () => void;
}

export function PhotoEditorControls({
  zoomIn, zoomOut, resetPosition, downloadImage, isDownloading, onBack
}: ControlsProps) {
  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={zoomIn}
          title="Zoom In"
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomOut}
          title="Zoom Out"
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetPosition}
          title="Center Image"
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          <Move className="h-5 w-5" />
        </Button>
      </div>

      <Button
        onClick={downloadImage}
        className="bg-[#FF5533] hover:bg-[#FF4422] text-white rounded-full px-6 py-6 w-full max-w-xs mb-2"
        disabled={isDownloading}
      >
        {isDownloading ? "Processing..." : (
          <>
            <Download className="mr-2 h-5 w-5" /> Download photo
          </>
        )}
      </Button>
      
      <Button
        variant="link"
        onClick={onBack}
        className="text-gray-400 hover:text-white"
      >
        Back to frame selection
      </Button>
    </>
  );
}
