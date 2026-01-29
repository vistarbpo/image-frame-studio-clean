#!/usr/bin/env node

/**
 * Script to create a new frame page
 * Usage: node scripts/create-page.js <page-name> [frame-type]
 * 
 * Examples:
 *   node scripts/create-page.js habibi-day square
 *   node scripts/create-page.js new-frame vertical
 * 
 * Frame types: square, horizontal, vertical, custom
 * If frame-type is not provided, defaults to 'square'
 * If frame-type is 'custom', you'll need to manually set dimensions in frameAssets
 */

const fs = require('fs');
const path = require('path');

const pageName = process.argv[2];
const frameType = process.argv[3] || 'square';

if (!pageName) {
  console.error('Error: Page name is required');
  console.log('Usage: node scripts/create-page.js <page-name> [frame-type]');
  console.log('Frame types: square, horizontal, vertical, custom');
  process.exit(1);
}

// Validate frame type
const validFrameTypes = ['square', 'horizontal', 'vertical', 'custom'];
if (!validFrameTypes.includes(frameType)) {
  console.error(`Error: Invalid frame type "${frameType}"`);
  console.log('Valid frame types:', validFrameTypes.join(', '));
  process.exit(1);
}

// Frame dimensions mapping
const frameDimensions = {
  square: { width: 2400, height: 2400 },
  horizontal: { width: 3200, height: 2400 },
  vertical: { width: 2400, height: 3200 },
  custom: { width: 1080, height: 1350 }, // Default custom dimensions
};

const frameTypeKebab = pageName.replace(/([A-Z])/g, '-$1').toLowerCase();
const frameTypePascal = pageName
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

const frameTypeConstant = frameTypeKebab.toUpperCase().replace(/-/g, '_');

console.log(`Creating new page: ${pageName}`);
console.log(`Frame type: ${frameType}`);
console.log(`Route: /${frameTypeKebab}`);
console.log(`Frame dimensions: ${frameDimensions[frameType].width}x${frameDimensions[frameType].height}`);

// 1. Create the page file
const pageTemplate = `import { useState, lazy, Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIVISIONS, Division } from "@/constants/divisions";
import { Label } from "@/components/ui/label";

const PhotoEditor = lazy(() => import("@/components/PhotoEditor").then(module => ({ 
  default: module.PhotoEditor 
}))) as React.LazyExoticComponent<React.ComponentType<import("@/components/PhotoEditor").PhotoEditorProps>>;

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const ${frameTypeConstant}_FRAME_TYPE = '${frameTypeKebab}';

const ${frameTypePascal}FramePage = () => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | "">("");

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
              ${frameTypePascal} Frame Studio
            </h1>
          </div>
          {!userImage ? (
            <div className="flex flex-col items-center w-full px-4 animate-fade-in">
              <div className="w-full max-w-md mb-8 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl opacity-20 group-hover:opacity-30 blur transition-opacity"></div>
                <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-2xl">
                  <img 
                    src={"/${frameTypeKebab}/frame.png"}
                    alt="${frameTypePascal} frame"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
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
              <div className="mt-4 mb-8 w-full flex justify-center">
                <label 
                  htmlFor="file-upload"
                  className={\`bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-full px-8 py-4 cursor-pointer w-full max-w-xs flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 font-medium \${isUploading ? 'opacity-70 cursor-not-allowed' : ''}\`}
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
                      if (!selectedDivision) {
                        alert("Please select a division first");
                        return;
                      }
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
              {selectedDivision && (
                <PhotoEditor
                  frameType={${frameTypeConstant}_FRAME_TYPE}
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

export default ${frameTypePascal}FramePage;
`;

const pagePath = path.join(__dirname, '..', 'src', 'pages', `${frameTypeKebab}.tsx`);
fs.writeFileSync(pagePath, pageTemplate);
console.log(`✓ Created page: ${pagePath}`);

// 2. Update frame assets
const frameAssetsPath = path.join(__dirname, '..', 'src', 'assets', 'frames', 'index.ts');
let frameAssetsContent = fs.readFileSync(frameAssetsPath, 'utf8');

// Add to frameAssets
const frameAssetEntry = `  '${frameTypeKebab}': {
    bottom: '/${frameTypeKebab}/frame.png',
  },`;
frameAssetsContent = frameAssetsContent.replace(
  /(\s+)(\};)/,
  `$1${frameAssetEntry}\n$1$2`
);

// Add to frameDimensions
const frameDimensionEntry = `  '${frameTypeKebab}': { width: ${frameDimensions[frameType].width}, height: ${frameDimensions[frameType].height} }, // ${frameType} frame dimensions`;
frameAssetsContent = frameAssetsContent.replace(
  /(\s+)(\};)/,
  `$1${frameDimensionEntry}\n$1$2`
);

// Add to FrameType
frameAssetsContent = frameAssetsContent.replace(
  /export type FrameType = ([^;]+);/,
  `export type FrameType = $1 | '${frameTypeKebab}';`
);

fs.writeFileSync(frameAssetsPath, frameAssetsContent);
console.log(`✓ Updated frame assets: ${frameAssetsPath}`);

// 3. Update App.tsx
const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Add import
const importName = `${frameTypePascal}FramePage`;
const importLine = `import ${importName} from "./pages/${frameTypeKebab}";`;
const lastImportIndex = appContent.lastIndexOf('import');
const lastImportLineEnd = appContent.indexOf('\n', lastImportIndex);
appContent = appContent.slice(0, lastImportLineEnd + 1) + importLine + '\n' + appContent.slice(lastImportLineEnd + 1);

// Add route
const routeLine = `              <Route path="/${frameTypeKebab}" element={<${importName} />} />`;
appContent = appContent.replace(
  /(\s+)(<Route path="\/milad1" element=\{<Milad1FramePage \/>\} \/>)/,
  `$1$2\n${routeLine}`
);

fs.writeFileSync(appPath, appContent);
console.log(`✓ Updated App.tsx: ${appPath}`);

// 4. Create public folder
const publicFolderPath = path.join(__dirname, '..', 'public', frameTypeKebab);
if (!fs.existsSync(publicFolderPath)) {
  fs.mkdirSync(publicFolderPath, { recursive: true });
  console.log(`✓ Created public folder: ${publicFolderPath}`);
  
  // Create README
  const readmeContent = `# ${frameTypePascal} Frame

Place your frame.png file in this directory.

Expected dimensions: ${frameDimensions[frameType].width}x${frameDimensions[frameType].height} pixels
Frame type: ${frameType}
`;
  fs.writeFileSync(path.join(publicFolderPath, 'README.md'), readmeContent);
  console.log(`✓ Created README.md in public folder`);
}

console.log('\n✅ Page creation complete!');
console.log(`\nNext steps:`);
console.log(`1. Add your frame.png file to: public/${frameTypeKebab}/frame.png`);
console.log(`2. If using custom dimensions, update frameDimensions in src/assets/frames/index.ts`);
console.log(`3. Test the page at: http://localhost:8080/${frameTypeKebab}`);
console.log(`4. Commit your changes`);




