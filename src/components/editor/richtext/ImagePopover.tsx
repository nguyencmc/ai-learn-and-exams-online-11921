import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image,
  Upload,
  Loader2,
  X,
  ImagePlus,
  Link,
  GalleryHorizontalEnd,
} from "lucide-react";
import { ImageLibraryPicker } from "@/components/editor/ImageLibraryPicker";
import { cn } from "@/lib/utils";
import type { ImagePopoverProps } from "./types";

export const ImagePopover: React.FC<ImagePopoverProps> = ({
  open,
  onOpenChange,
  saveSelection,
  imageUrl,
  setImageUrl,
  insertImage,
  uploadFileInputRef,
  uploadPreview,
  uploadFile,
  clearUploadPreview,
  insertUploadedImage,
  isUploading,
  uploadDragOver,
  setUploadDragOver,
  handleUploadDrop,
  uploadDimensions,
  uploadOriginalSize,
  onImageUpload,
  imageBucket,
  imageBucketPrefix,
  insertLibraryImage,
  libraryRefreshKey,
}) => (
  <Popover
    open={open}
    onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) {
        setImageUrl("");
      }
    }}
  >
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={saveSelection}
      >
        <Image className="h-4 w-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className={cn("p-3", imageBucket ? "w-96" : "w-80")} align="start">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Chèn hình ảnh</span>
        </div>

        <Tabs defaultValue="upload">
          <TabsList className={cn("grid w-full h-8", imageBucket ? "grid-cols-3" : "grid-cols-2")}>
            <TabsTrigger value="upload" className="text-xs gap-1">
              <Upload className="h-3 w-3" />
              Tải lên
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs gap-1">
              <Link className="h-3 w-3" />
              URL ảnh
            </TabsTrigger>
            {imageBucket && (
              <TabsTrigger value="library" className="text-xs gap-1">
                <GalleryHorizontalEnd className="h-3 w-3" />
                Thư viện
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Upload Tab ── */}
          <TabsContent value="upload" className="mt-3 space-y-3">
            {uploadPreview ? (
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="w-full max-h-40 object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearUploadPreview}
                    className="absolute top-1 right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {uploadFile?.name}{" "}
                  <span className="opacity-60">
                    ({uploadDimensions ? `${uploadDimensions.w}×${uploadDimensions.h}px · ` : ""}
                    {uploadFile ? (uploadFile.size / 1024).toFixed(0) : 0} KB
                    {uploadOriginalSize && uploadFile && uploadOriginalSize > uploadFile.size ? (
                      <span className="text-green-500 ml-1">
                        ↓ từ {(uploadOriginalSize / 1024).toFixed(0)} KB
                      </span>
                    ) : null})
                  </span>
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={insertUploadedImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {onImageUpload ? "Tải lên & chèn ảnh" : "Chèn ảnh"}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* Drag-and-drop zone */
              <div
                onDrop={handleUploadDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setUploadDragOver(true);
                }}
                onDragLeave={() => setUploadDragOver(false)}
                onClick={() => uploadFileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all select-none",
                  uploadDragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Kéo thả hoặc click để chọn ảnh
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG, GIF, WEBP (tối đa 10MB)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── URL Tab ── */}
          <TabsContent value="url" className="mt-3 space-y-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && insertImage()}
              className="text-sm"
            />
            {imageUrl && (
              <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full max-h-32 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <Button
              size="sm"
              onClick={insertImage}
              className="w-full"
              disabled={!imageUrl.trim()}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Chèn ảnh
            </Button>
          </TabsContent>

          {/* ── Library Tab ── */}
          {imageBucket && (
            <TabsContent value="library" className="mt-3">
              <ImageLibraryPicker
                bucket={imageBucket}
                prefix={imageBucketPrefix}
                onSelect={insertLibraryImage}
                refreshKey={libraryRefreshKey}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PopoverContent>
  </Popover>
);
