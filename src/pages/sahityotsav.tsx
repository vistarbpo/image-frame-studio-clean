import { useState, lazy, Suspense } from "react";
import { Footer } from "@/components/Footer";

const PhotoEditor = lazy(() => import("@/components/PhotoEditor").then(module => ({ 
  default: module.PhotoEditor 
}))) as React.LazyExoticComponent<React.ComponentType<import("@/components/PhotoEditor").PhotoEditorProps>>;

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const SAHITYOTSAV_FRAME_TYPE = 'sahityotsav';

const SahityotsavFramePage = () => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleBack = () => {
    setUserImage(null);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="flex-grow pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              Sahityotsav Frame Studio
            </h1>
          </div>
          {!userImage ? (
            <div className="flex flex-col items-center w-full px-4 animate-fade-in">
              <div className="w-full max-w-md mb-8 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
                <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-2xl">
                  <img 
                    src={"/sahityotsav/frame.png"}
                    alt="Sahityotsav frame"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>
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
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg> Upload photo
                    </>
                  )}
                  <input 
                    id="file-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setUserImage(ev.target?.result as string);
                        setIsUploading(false);
                      };
                      reader.readAsDataURL(file);
                    }} 
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <PhotoEditor
                frameType={SAHITYOTSAV_FRAME_TYPE}
                userImage={userImage}
                divisionName=""
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

export default SahityotsavFramePage;

