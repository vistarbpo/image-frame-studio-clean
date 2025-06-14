
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
        className="bg-[#FF5533] hover:bg-[#FF4422] text-white rounded-full px-6 py-6 w-full max-w-xs"
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
