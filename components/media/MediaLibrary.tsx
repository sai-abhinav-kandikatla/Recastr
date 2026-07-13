"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  ImagePlus,
  Trash2,
  Copy,
  FileImage,
  Film,
  Music,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  uploadedAt: string;
}

export function MediaLibrary() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("recastr_media_library");
    if (saved) {
      try {
        setMediaItems(JSON.parse(saved));
      } catch {
        // ignore parsing errors
      }
    }
  }, []);

  const saveToLocalStorage = (items: MediaItem[]) => {
    localStorage.setItem("recastr_media_library", JSON.stringify(items));
  };

  const handleFile = (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is too large. Max size is 15MB for local storage storage.");
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      // Simulate network upload latency for high-quality SaaS feel
      setTimeout(() => {
        const newItem: MediaItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: formatBytes(file.size),
          url: e.target?.result as string || "",
          uploadedAt: new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };

        const updated = [newItem, ...mediaItems];
        setMediaItems(updated);
        saveToLocalStorage(updated);
        setIsUploading(false);
        toast.success(`"${file.name}" uploaded successfully!`);
      }, 1200);
    };

    reader.onerror = () => {
      setIsUploading(false);
      toast.error("Error reading file.");
    };

    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = (id: string, name: string) => {
    const updated = mediaItems.filter((item) => item.id !== id);
    setMediaItems(updated);
    saveToLocalStorage(updated);
    toast.success(`Deleted "${name}"`);
  };

  const handleCopyLink = (id: string, url: string) => {
    // Copy the Base64 or a mock URL to clipboard
    const displayUrl = url.startsWith("data:") 
      ? `https://recastr.app/media/file_${id}` 
      : url;

    navigator.clipboard.writeText(displayUrl);
    setCopiedId(id);
    toast.success("Media link copied to clipboard!");
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function getFileIcon(type: string) {
    if (type.startsWith("image/")) return FileImage;
    if (type.startsWith("video/")) return Film;
    return Music;
  }

  return (
    <div className="space-y-8">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept="image/*,video/*,audio/*"
        className="hidden"
      />

      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-12 text-center ${
          isDragging
            ? "border-white bg-[#151515]"
            : "border-[#232323] bg-[#0F0F0F] hover:border-[#333]"
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A1A1A] border border-[#232323]">
            {isUploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-white" />
            ) : (
              <Upload className="h-7 w-7 text-[#8A8A8A]" />
            )}
          </span>

          <h2 className="mt-6 text-lg font-semibold text-white">
            {isUploading ? "Uploading file..." : "Upload your media"}
          </h2>
          <p className="mt-2 max-w-md text-sm text-[#8A8A8A]">
            Drag and drop images, videos, or audio here, or click to browse.
          </p>
          <p className="mt-2 text-xs text-[#555]">
            Supports PNG, JPG, GIF, MP4, MP3 — up to 15 MB
          </p>
        </div>
      </div>

      {/* Media Vault Grid */}
      {mediaItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white">Media Assets ({mediaItems.length})</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {mediaItems.map((item) => {
              const IconComponent = getFileIcon(item.type);
              const isImage = item.type.startsWith("image/");
              const isVideo = item.type.startsWith("video/");

              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-[#232323] bg-[#0F0F0F] overflow-hidden transition-all hover:border-[#333]"
                >
                  {/* Visual Preview */}
                  <div className="relative aspect-video w-full bg-[#151515] flex items-center justify-center border-b border-[#232323]">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Media previews are local data URLs, not remote optimizable assets.
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : isVideo ? (
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                        controls={false}
                        muted
                      />
                    ) : (
                      <IconComponent className="h-10 w-10 text-[#8A8A8A]" />
                    )}

                    {/* Media Type Badge */}
                    <div className="absolute top-2 left-2 rounded-lg bg-black/60 backdrop-blur-md p-1.5 border border-[#232323]">
                      <IconComponent className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>

                  {/* Asset Information */}
                  <div className="p-4">
                    <p className="truncate text-sm font-semibold text-white" title={item.name}>
                      {item.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#8A8A8A]">
                      <span>{item.size}</span>
                      <span>{item.uploadedAt}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex items-center gap-2 border-t border-[#232323] pt-3">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item.id, item.url)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#151515] border border-[#232323] py-2 text-xs font-medium text-white hover:bg-[#232323] transition-colors"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-[#8A8A8A]" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#151515] border border-red-950 hover:bg-red-950/40 text-red-400 transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Format Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormatCard
          icon={FileImage}
          title="Images"
          formats="PNG, JPG, GIF, WEBP, SVG"
        />
        <FormatCard
          icon={Film}
          title="Videos"
          formats="MP4, WEBM, MOV"
        />
        <FormatCard
          icon={Music}
          title="Audio"
          formats="MP3, WAV, OGG"
        />
      </div>
    </div>
  );
}

/* ── Format Card ──────────────────────────────────────────────── */

interface FormatCardProps {
  icon: React.ElementType;
  title: string;
  formats: string;
}

function FormatCard({ icon: Icon, title, formats }: FormatCardProps) {
  return (
    <div className="rounded-2xl border border-[#232323] bg-[#0F0F0F] p-5 transition-colors hover:border-[#333]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1A1A]">
        <Icon className="h-4 w-4 text-[#8A8A8A]" />
      </span>
      <p className="mt-3 text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-[#8A8A8A]">{formats}</p>
    </div>
  );
}
