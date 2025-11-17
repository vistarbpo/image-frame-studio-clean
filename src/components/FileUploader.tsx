
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isUploading: boolean;
}

export function FileUploader({ onFileSelected, isUploading }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <Button 
        onClick={handleClick}
        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-full px-6 py-6 w-full max-w-xs shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105"
        disabled={isUploading}
      >
        {isUploading ? (
          "Processing..."
        ) : (
          <>
            <Upload className="mr-2 h-5 w-5" /> Upload photo
          </>
        )}
      </Button>
    </>
  );
}
