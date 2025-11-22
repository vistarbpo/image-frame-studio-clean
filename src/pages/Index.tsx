import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { FrameType, frameAssets } from "@/assets/frames";
import { Upload } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIVISIONS, Division } from "@/constants/divisions";
import { Label } from "@/components/ui/label";

// Lazy load the PhotoEditor component
const PhotoEditor = lazy(() => import("@/components/PhotoEditor").then(module => ({ 
  default: module.PhotoEditor 
}))) as React.LazyExoticComponent<React.ComponentType<import("@/components/PhotoEditor").PhotoEditorProps>>;

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const Index = () => {
  const [selectedFrame, setSelectedFrame] = useState<FrameType>('square');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | "">("");

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedDivision) {
      alert("Please select a division first");
      return;
    }
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
    setSelectedDivision("");
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="flex-grow pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              Image Frame Studio
            </h1>
          </div>
          {!userImage ? (
        // Frame selection and upload view
        <div className="flex flex-col items-center w-full px-4 animate-fade-in">
          {/* Frame preview */}
          <div className="w-full max-w-md mb-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
            <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-2xl">
              <img 
                src={frameAssets[selectedFrame].bottom}
                alt={`${selectedFrame} frame`}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
          {/* Frame selector */}
          <div className="flex gap-3 justify-center mb-6">
            <Button
              variant={selectedFrame === 'square' ? "default" : "outline"}
              onClick={() => handleFrameSelect('square')}
              className="rounded-full px-6 py-2 transition-all duration-200 hover:scale-105"
            >
              Square
            </Button>
            <Button
              variant={selectedFrame === 'horizontal' ? "default" : "outline"}
              onClick={() => handleFrameSelect('horizontal')}
              className="rounded-full px-6 py-2 transition-all duration-200 hover:scale-105"
            >
              Horizontal
            </Button>
            <Button
              variant={selectedFrame === 'vertical' ? "default" : "outline"}
              onClick={() => handleFrameSelect('vertical')}
              className="rounded-full px-6 py-2 transition-all duration-200 hover:scale-105"
            >
              Vertical
            </Button>
          </div>
          {/* Division selector */}
          <div className="w-full max-w-xs mb-6">
            <Label htmlFor="division-select" className="text-sm font-medium mb-2 block text-center">
              Division name:
            </Label>
            <Select value={selectedDivision} onValueChange={(value) => setSelectedDivision(value as Division)}>
              <SelectTrigger id="division-select" className="w-full bg-card/50 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="Select a division" />
              </SelectTrigger>
              <SelectContent>
                {DIVISIONS.map((division) => (
                  <SelectItem key={division} value={division}>
                    {division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* File uploader */}
          <div className="mt-4 mb-8 w-full flex justify-center">
            <label 
              htmlFor="file-upload"
              className={`bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-full px-8 py-4 cursor-pointer w-full max-w-xs flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 font-medium ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Uploading...
                </span>
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
              {selectedDivision && (
                <PhotoEditor
                  frameType={selectedFrame}
                  userImage={userImage}
                  divisionName={selectedDivision as Division}
                  onBack={handleBack}
                />
              )}
            </Suspense>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
