"use client";
import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

type CloudinaryUploadProps = {
  cloudName: string;
  uploadPreset: string;
  onUpload: (url: string) => void;
  disabled?: boolean;
};

export function CloudinaryUpload({ cloudName, uploadPreset, onUpload, disabled }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (data.secure_url) {
        onUpload(data.secure_url);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || disabled}
        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--text-muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:opacity-40"
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Upload size={16} />
        )}
        {uploading ? "Subiendo..." : "Subir imagen"}
      </button>
    </>
  );
}
