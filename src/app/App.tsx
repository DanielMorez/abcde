import { useCallback, useRef, useState } from "react";
import { ImageIcon, UploadCloudIcon, CheckCircle2Icon, AlertCircleIcon, XIcon } from "lucide-react";

{/* MARKER-MAKE-KIT-INVOKED */}

type TargetFormat = "PNG" | "JPG";

interface UploadedImage {
  file: File;
  dataUrl: string;
  name: string;
  size: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getOutputName(originalName: string, targetFormat: TargetFormat): string {
  const base = originalName.replace(/\.[^/.]+$/, "");
  return `${base}.${targetFormat.toLowerCase()}`;
}

async function convertImage(dataUrl: string, targetFormat: TargetFormat): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      if (targetFormat === "JPG") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      const mimeType = targetFormat === "PNG" ? "image/png" : "image/jpeg";
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Conversion failed"));
      }, mimeType, 0.92);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

export default function App() {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("PNG");
  const [isDragging, setIsDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setSuccess(false);

    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPG or PNG image.");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPG and PNG files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploaded({
        file,
        dataUrl: e.target?.result as string,
        name: file.name,
        size: formatBytes(file.size),
      });
      // Auto-select the opposite format
      setTargetFormat(file.type === "image/jpeg" ? "PNG" : "JPG");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleConvert = async () => {
    if (!uploaded) return;
    setConverting(true);
    setError(null);
    setSuccess(false);
    try {
      const blob = await convertImage(uploaded.dataUrl, targetFormat);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getOutputName(uploaded.name, targetFormat);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Conversion failed. Please try another image.");
    } finally {
      setConverting(false);
    }
  };

  const handleRemove = () => {
    setUploaded(null);
    setSuccess(false);
    setError(null);
  };

  const sourceFormat = uploaded
    ? uploaded.file.type === "image/jpeg" ? "JPG" : "PNG"
    : null;

  return (
    <div
      style={{ backgroundColor: "#F8FAFC", minHeight: "100dvh" }}
      className="flex flex-col items-center py-10 px-4"
    >
      <div style={{ width: "100%", maxWidth: "450px" }} className="flex flex-col gap-5">

        {/* Header */}
        <header className="flex flex-col items-center gap-1 pt-2 pb-1">
          <h1
            style={{
              color: "#0F172A",
              fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
            }}
          >
            Image Converter
          </h1>
          <p
            style={{
              color: "#64748B",
              fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Convert JPG ⇄ PNG instantly
          </p>
        </header>

        {/* Upload Zone */}
        {!uploaded && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "24px",
              border: isDragging
                ? "2px dashed #2563EB"
                : "2px dashed #CBD5E1",
              cursor: "pointer",
              transition: "border-color 0.2s, background-color 0.2s",
              backgroundColor: isDragging ? "#EFF6FF" : "#FFFFFF",
            }}
            className="flex flex-col items-center justify-center gap-3 py-12 px-6 select-none"
          >
            <div
              style={{
                backgroundColor: isDragging ? "#DBEAFE" : "#F1F5F9",
                borderRadius: "16px",
                width: "64px",
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s",
              }}
            >
              {isDragging
                ? <UploadCloudIcon size={28} color="#2563EB" />
                : <ImageIcon size={28} color="#94A3B8" />
              }
            </div>
            <div className="flex flex-col items-center gap-1">
              <span
                style={{
                  color: "#0F172A",
                  fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                Tap to upload file
              </span>
              <span
                style={{
                  color: "#94A3B8",
                  fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                  fontSize: "13px",
                }}
              >
                Supports JPG, PNG
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}

        {/* Image Preview */}
        {uploaded && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
            }}
          >
            {/* Preview image */}
            <div
              style={{
                backgroundColor: "#F1F5F9",
                position: "relative",
                aspectRatio: "16/10",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={uploaded.dataUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              {/* Remove button */}
              <button
                onClick={handleRemove}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "rgba(15,23,42,0.55)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(4px)",
                }}
                aria-label="Remove image"
              >
                <XIcon size={15} color="#FFFFFF" />
              </button>
            </div>

            {/* File meta */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: "1px solid #F1F5F9" }}
            >
              <div
                style={{
                  backgroundColor: "#EFF6FF",
                  borderRadius: "10px",
                  padding: "6px 10px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: "#2563EB",
                    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {sourceFormat}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  style={{
                    color: "#0F172A",
                    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {uploaded.name}
                </span>
                <span
                  style={{
                    color: "#94A3B8",
                    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                    fontSize: "12px",
                  }}
                >
                  {uploaded.size}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Format Selector */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              color: "#64748B",
              fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Convert to
          </p>
          <div
            style={{
              backgroundColor: "#F1F5F9",
              borderRadius: "14px",
              padding: "4px",
              display: "flex",
              gap: "4px",
            }}
          >
            {(["PNG", "JPG"] as TargetFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTargetFormat(fmt)}
                style={{
                  flex: 1,
                  height: "48px",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  transition: "all 0.18s ease",
                  backgroundColor: targetFormat === fmt ? "#FFFFFF" : "transparent",
                  color: targetFormat === fmt ? "#2563EB" : "#64748B",
                  boxShadow: targetFormat === fmt
                    ? "0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(37,99,235,0.08)"
                    : "none",
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "#FEF2F2",
              borderRadius: "14px",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertCircleIcon size={18} color="#EF4444" style={{ flexShrink: 0 }} />
            <span
              style={{
                color: "#B91C1C",
                fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                fontSize: "14px",
              }}
            >
              {error}
            </span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: "14px",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <CheckCircle2Icon size={18} color="#16A34A" style={{ flexShrink: 0 }} />
            <span
              style={{
                color: "#15803D",
                fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              File downloaded successfully!
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={uploaded ? handleConvert : () => fileInputRef.current?.click()}
          disabled={converting}
          style={{
            width: "100%",
            height: "56px",
            backgroundColor: converting ? "#93C5FD" : "#2563EB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "16px",
            cursor: converting ? "not-allowed" : "pointer",
            fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "0.01em",
            boxShadow: converting
              ? "none"
              : "0 4px 14px rgba(37,99,235,0.35), 0 1px 3px rgba(37,99,235,0.2)",
            transition: "all 0.18s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {converting ? (
            <>
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#FFFFFF",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  flexShrink: 0,
                }}
              />
              Converting…
            </>
          ) : uploaded ? (
            `Convert & Download as ${targetFormat}`
          ) : (
            "Upload an Image to Convert"
          )}
        </button>

        {/* Footer */}
        <footer className="flex justify-center pb-4">
          <p
            style={{
              color: "#94A3B8",
              fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            100% Secure. Conversion happens directly in your browser.
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
