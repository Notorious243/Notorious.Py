import React from "react";
import { cn } from "@/lib/utils";
import { X, FileIcon, ImageIcon } from "lucide-react";

export function Attachments({ 
  children, 
  className,
  variant = "grid"
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: "grid" | "list";
}) {
  return (
    <div className={cn(
      "flex gap-2",
      variant === "grid" ? "flex-wrap" : "flex-col",
      className
    )}>
      {children}
    </div>
  );
}

export function Attachment({ 
  children, 
  data,
  className 
}: { 
  children: React.ReactNode; 
  data: {
    id: string;
    type: string;
    name?: string;
    filename?: string;
    url?: string;
    data?: string;
    mimeType?: string;
    mediaType?: string;
  };
  className?: string;
}) {
  return (
    <div className={cn(
      "group relative flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all min-w-[120px] max-w-[200px]",
      className
    )}>
      {/* Provide data to children via context if needed, but for now we'll just render */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { data });
        }
        return child;
      })}
    </div>
  );
}

export function AttachmentPreview({ data }: { data?: any }) {
  if (!data) return null;
  
  const isImage = data.mediaType?.startsWith("image/") || data.mimeType?.startsWith("image/") || data.type === "image";
  const displayName = data.filename || data.name || 'attachment';
  const mediaType = data.mediaType || data.mimeType || data.type;
  const inlineUrl = data.url || (data.data && data.mimeType ? `data:${data.mimeType};base64,${data.data}` : undefined);

  return (
    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
      {isImage && inlineUrl ? (
        <img src={inlineUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : isImage ? (
        <ImageIcon className="w-4 h-4 text-zinc-500" />
      ) : (
        <FileIcon className="w-4 h-4 text-zinc-500" />
      )}
      <div className="flex-1 min-w-0 ml-2">
        <div className="text-[10px] font-medium text-zinc-300 truncate">{displayName}</div>
        <div className="text-[8px] text-zinc-500 uppercase tracking-tighter">{String(mediaType).split('/')[1] || data.type}</div>
      </div>
    </div>
  );
}

export function AttachmentRemove({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shadow-xl"
    >
      <X className="w-2.5 h-2.5" />
    </button>
  );
}
