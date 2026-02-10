import { SUPABASE_URL } from '../services/supabase.js'

export const DOCTOR_AVATARS_BUCKET = 'doctor-avatars'

function encodeStoragePath(path) {
  return String(path)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

export function getDoctorAvatarPublicUrl(doctor) {
  if (!doctor?.avatar_path) return null
  if (!SUPABASE_URL || SUPABASE_URL === 'https://placeholder.supabase.co') return null

  const encodedPath = encodeStoragePath(doctor.avatar_path)
  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${DOCTOR_AVATARS_BUCKET}/${encodedPath}`
  const version = doctor.avatar_updated_at ? String(doctor.avatar_updated_at) : null
  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl
}

export function renderDoctorAvatarImg(doctor, sizePx = 32, extraClassName = '') {
  const url = getDoctorAvatarPublicUrl(doctor)
  if (!url) return ''

  const className = ['doctor-avatar-img', extraClassName].filter(Boolean).join(' ')
  const size = Number(sizePx) || 32
  const alt = doctor?.name ? `Снимка: ${doctor.name}` : 'Профилна снимка'

  return `
    <img
      src="${url}"
      alt="${alt.replaceAll('"', '&quot;')}"
      class="${className}"
      style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover;"
      loading="lazy"
    />
  `.trim()
}
