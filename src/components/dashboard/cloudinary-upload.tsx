"use client";
import { useEffect, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

type CloudinaryUploadProps = {
  cloudName: string;
  uploadPreset: string;
  onUpload: (url: string) => void;
  disabled?: boolean;
};

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: Error | null, result: { event: string; info: { secure_url: string } }) => void,
      ) => { open: () => void };
    };
  }
}

export function CloudinaryUpload({ cloudName, uploadPreset, onUpload, disabled }: CloudinaryUploadProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const widgetRef = useRef<{ open: () => void } | null>(null);

  useEffect(() => {
    if (window.cloudinary) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpload = () => {
    if (!window.cloudinary) return;
    setUploading(true);
    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local", "camera", "google_drive"],
        multiple: false,
        maxFiles: 1,
        cropping: true,
        croppingAspectRatio: 1,
        showAdvancedOptions: false,
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#e4e4e7",
            tabIcon: "#18181b",
            menuIcons: "#18181b",
            textDark: "#18181b",
            textLight: "#fafafa",
            link: "#18181b",
            action: "#18181b",
            inactiveTabIcon: "#a1a1aa",
            error: "#ef4444",
            inProgress: "#18181b",
            complete: "#22c55e",
            sourceBg: "#fafafa",
          },
        },
      },
      (error, result) => {
        if (error) {
          setUploading(false);
          return;
        }
        if (result.event === "success") {
          onUpload(result.info.secure_url);
          setUploading(false);
        }
        if (result.event === "close" && uploading) {
          setUploading(false);
        }
      },
    );
    widgetRef.current.open();
  };

  return (
    <button
      type="button"
      onClick={handleUpload}
      disabled={!scriptLoaded || uploading || disabled}
      className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 transition hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-40"
    >
      {uploading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Upload size={16} />
      )}
      {uploading ? "Subiendo..." : "Subir imagen"}
    </button>
  );
}
