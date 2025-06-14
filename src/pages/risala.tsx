import { useState, lazy, Suspense } from "react";
import { Footer } from "@/components/Footer";

const PhotoEditor = lazy(() => import("@/components/PhotoEditor").then(module => ({ 
  default: module.PhotoEditor 
})));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5533]"></div>
  </div>
);

const RISALA_FRAME_TYPE = 'risala';

const RisalaFramePage = () => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Reset to initial state
  const handleBack = () => {
    setUserImage(null);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="flex-grow pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#FF5533]">Risala Frame Studio</h1>
          </div>
          {!userImage ? (
        <div className="flex flex-col items-center w-full px-4 animate-fade-in">
          {/* Frame preview */}
          <div className="w-full max-w-md mb-6">
            <img 
              src={"/risala/frame.png"}
              alt="Risala frame"
              className="w-full h-auto rounded-md border border-gray-800 shadow-lg"
            />
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
                frameType={RISALA_FRAME_TYPE}
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

export default RisalaFramePage; 