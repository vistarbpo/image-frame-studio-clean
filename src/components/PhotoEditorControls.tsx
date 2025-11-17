
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
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={zoomIn}
          title="Zoom In"
          className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card hover:border-primary/50 transition-all duration-200 hover:scale-110"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomOut}
          title="Zoom Out"
          className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card hover:border-primary/50 transition-all duration-200 hover:scale-110"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetPosition}
          title="Center Image"
          className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card hover:border-primary/50 transition-all duration-200 hover:scale-110"
        >
          <Move className="h-5 w-5" />
        </Button>
      </div>

      <Button
        onClick={downloadImage}
        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-full px-8 py-6 w-full max-w-xs mb-3 shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 font-medium"
        disabled={isDownloading}
      >
        {isDownloading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
            Processing...
          </span>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" /> Download photo
          </>
        )}
      </Button>
      
      <Button
        variant="link"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        Back to frame selection
      </Button>
    </>
  );
}
