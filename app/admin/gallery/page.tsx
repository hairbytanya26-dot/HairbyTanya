"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GalleryImage } from "@/lib/types";
import Image from "next/image";

const BUCKET = "gallery";

export default function AdminGalleryPage() {
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const { data } = await supabase
      .from("gallery_images")
      .select("*")
      .order("sort_order", { ascending: true });
    setImages(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 8 * 1024 * 1024) {
        setError("Each image must be under 8MB.");
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) {
        setError(`Could not upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

      await supabase.from("gallery_images").insert({
        image_url: publicUrlData.publicUrl,
        storage_path: path,
        sort_order: images.length,
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    refresh();
  }

  async function deleteImage(image: GalleryImage) {
    if (!confirm("Delete this photo?")) return;
    await supabase.storage.from(BUCKET).remove([image.storage_path]);
    await supabase.from("gallery_images").delete().eq("id", image.id);
    refresh();
  }

  async function toggleActive(image: GalleryImage) {
    await supabase
      .from("gallery_images")
      .update({ is_active: !image.is_active })
      .eq("id", image.id);
    refresh();
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Gallery</h1>
      <p className="mt-2 text-plum/70">
        Photos appear on the homepage. Upload as many as you like — drag to reorder isn&apos;t
        supported yet, but you can show/hide or delete any photo below.
      </p>

      <div className="mt-6 rounded-2xl bg-white/70 p-6">
        <label className="mb-2 block text-sm text-plum">Upload photos</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
          className="block w-full text-sm text-plum file:mr-4 file:rounded-full file:border-0 file:bg-plum file:px-5 file:py-2 file:text-blush file:transition-colors hover:file:bg-glow"
        />
        {uploading && <p className="mt-3 text-sm text-plum/70">Uploading…</p>}
        {error && (
          <p className="mt-3 text-sm text-maroon" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {images.map((image) => (
          <div key={image.id} className="overflow-hidden rounded-2xl bg-white/70">
            <div className="relative aspect-square">
              <Image
                src={image.image_url}
                alt={image.caption || "Gallery photo"}
                fill
                className="object-cover"
                sizes="300px"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <label className="flex items-center gap-1 text-plum">
                <input
                  type="checkbox"
                  checked={image.is_active}
                  onChange={() => toggleActive(image)}
                />
                Show
              </label>
              <button onClick={() => deleteImage(image)} className="text-maroon hover:underline">
                Delete
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-full text-center text-plum/60">No photos yet — upload some above.</p>
        )}
      </div>
    </div>
  );
}
