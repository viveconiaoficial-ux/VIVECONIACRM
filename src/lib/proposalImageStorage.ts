import { supabase } from '@/lib/supabase'

export const PROPOSAL_IMAGES_BUCKET = 'proposal-images'

/** JPEG comprimido, lado máx ~1280 px (apta para WhatsApp / adjuntos). */
const MAX_SIDE = 1280
const JPEG_QUALITY = 0.8

/** Máximo de ficheros por lead en el CRM. */
export const MAX_PROPOSAL_IMAGES_PER_LEAD = 12

function compressImageToJpegBlob(
  file: File,
  maxSide: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (!w || !h) {
          reject(new Error('No se pudo leer la imagen'))
          return
        }
        const scale = Math.min(1, maxSide / Math.max(w, h))
        w = Math.max(1, Math.round(w * scale))
        h = Math.max(1, Math.round(h * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas no disponible'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          (blob) => {
            if (!blob) reject(new Error('No se pudo comprimir'))
            else resolve(blob)
          },
          'image/jpeg',
          quality,
        )
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Error al procesar la imagen'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No es una imagen válida'))
    }
    img.src = objectUrl
  })
}

export function proposalImagePublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(PROPOSAL_IMAGES_BUCKET)
    .getPublicUrl(storagePath)
  return data.publicUrl
}

export async function uploadProposalBundleImage(
  leadId: string,
  file: File,
): Promise<string> {
  const blob = await compressImageToJpegBlob(file, MAX_SIDE, JPEG_QUALITY)
  const name = `${crypto.randomUUID()}.jpg`
  const path = `${leadId}/${name}`

  const { error } = await supabase.storage
    .from(PROPOSAL_IMAGES_BUCKET)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    })
  if (error) throw error
  return path
}

export async function removeProposalBundleImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(PROPOSAL_IMAGES_BUCKET)
    .remove([storagePath])
  if (error) throw error
}
