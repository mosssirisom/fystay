import "server-only";
import { createClient } from "@supabase/supabase-js";

const LISTING_PHOTOS_BUCKET = "listing-photos";

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function uploadListingPhoto(
  file: File,
  ownerId: string,
): Promise<{ url: string } | { error: string }> {
  const client = getStorageClient();
  if (!client) {
    return { error: "Photo uploads aren't configured on this deployment yet." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await client.storage
    .from(LISTING_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return { error: error.message };
  }

  const { data } = client.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
