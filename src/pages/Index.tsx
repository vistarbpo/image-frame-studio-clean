import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { FrameType, frameAssets } from "@/assets/frames";
import { Upload } from "lucide-react";
import { Footer } from "@/components/Footer";

// Lazy load the PhotoEditor component
const PhotoEditor = lazy(() => import("@/components/PhotoEditor").then(module => ({ 
  default: module.PhotoEditor 
})));

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5533]"></div>
  </div>
);

const Index = () => {
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('square');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserImage(e.target?.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle frame type selection
  const handleFrameSelect = (frameType: FrameType) => {
    setSelectedFrame(frameType);
  };

  // Reset to initial state
  const handleBack = () => {
    setUserImage(null);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="flex-grow pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#FF5533]">Image Frame Studio</h1>
          </div>
          {!userImage ? (
        // Frame selection and upload view
        <div className="flex flex-col items-center w-full px-4 animate-fade-in">
          {/* Frame preview */}
          <div className="w-full max-w-md mb-6">
            <img 
              src={frameAssets[selectedFrame].bottom}
              alt={`${selectedFrame} frame`}
              className="w-full h-auto rounded-md border border-gray-800 shadow-lg"
            />
          </div>
          {/* Frame selector */}
          <div className="flex gap-2 justify-center mb-4">
            <Button
              variant={selectedFrame === 'square' ? "default" : "outline"}
              onClick={() => handleFrameSelect('square')}
              className="rounded-full"
            >
              Square
            </Button>
            <Button
              variant={selectedFrame === 'horizontal' ? "default" : "outline"}
              onClick={() => handleFrameSelect('horizontal')}
              className="rounded-full"
            >
              Horizontal
            </Button>
            <Button
              variant={selectedFrame === 'vertical' ? "default" : "outline"}
              onClick={() => handleFrameSelect('vertical')}
              className="rounded-full"
            >
              Vertical
            </Button>
          </div>
          {/* File uploader */}
          <div className="mt-4 mb-8 w-full flex justify-center">
            <label 
              htmlFor="file-upload"
              className={`bg-[#FF5533] hover:bg-[#FF4422] text-white rounded-full px-6 py-3 cursor-pointer w-full max-w-xs flex items-center justify-center ${isUploading ? 'opacity-70' : ''}`}
            >
              {isUploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" /> Upload photo
                </>
              )}
              <input 
                id="file-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
          ) : (
            // Photo editor view with Suspense
            <Suspense fallback={<LoadingSpinner />}>
              <PhotoEditor
                frameType={selectedFrame}
                userImage={userImage}
                onBack={handleBack}
              />
            </Suspense>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
