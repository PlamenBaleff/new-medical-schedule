// Settings page component
import { logout } from '../services/auth.js'
import { getDoctorByEmail, getPatientByEmail, updateDoctor, updatePatient, createDoctor, createPatient } from '../services/supabase.js'
import { eventBus, EVENTS } from '../services/eventBus.js'
import { supabase } from '../services/supabase.js'
import { navigateTo } from '../services/router.js'
import { DOCTOR_AVATARS_BUCKET, renderDoctorAvatarImg } from '../utils/doctorAvatar.js'
import { loadAndApplyThemeForUser, saveThemeForUser } from '../services/theme.js'

export default function SettingsPage() {
  const container = document.createElement('div')
  container.className = 'container py-5'
  
  const showLoading = () => {
    container.innerHTML = `
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="alert alert-warning">Зареждане на профила...</div>
        </div>
      </div>
    `
  }

  const showNotLoggedIn = () => {
    container.innerHTML = `
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="alert alert-warning">Трябва да сте логнати за да видите настройките.</div>
        </div>
      </div>
    `
  }

  async function reloadSettings() {
    showLoading()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showNotLoggedIn()
        return
      }

      const html = buildSettingsHTML(user)
      container.innerHTML = html
      setupSettingsHandlers(user, container)
    } catch (error) {
      console.error('Error getting user session:', error)
      showNotLoggedIn()
    }
  }

  // Always load fresh user session for this view
  reloadSettings()

  // Refresh settings on auth state change (login/logout or user change)
  supabase.auth.onAuthStateChange(() => {
    reloadSettings()
  })

  return container
}

function buildSettingsHTML(currentUser) {
  return `
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <h1 class="mb-4"><i class="fas fa-cogs" style="font-size: 24px; margin-right: 8px;"></i> Настройки</h1>
        
        <!-- Profile Settings Card -->
        <div class="card shadow-sm mb-4" id="profile-card">
          <div class="card-header" style="background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%); color: white;">
            <h5 class="mb-0"><i class="fas fa-user-circle" style="font-size: 20px; margin-right: 8px;"></i> Профил</h5>
          </div>
          <div class="card-body">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Зареждане...</span>
            </div>
          </div>
        </div>
        
        <!-- Theme Settings Card -->
        <div class="card shadow-sm mb-4">
          <div class="card-header" style="background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%); color: white;">
            <h5 class="mb-0"><i class="fas fa-palette" style="font-size: 20px; margin-right: 8px;"></i> Тема</h5>
          </div>
          <div class="card-body">
            <p class="mb-3"><i class="fas fa-moon" style="margin-right: 6px;"></i> Изберете тема за приложението:</p>
            <div class="d-flex gap-3">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="theme" id="theme-light" value="light" checked>
                <label class="form-check-label" for="theme-light">
                  <i class="fas fa-sun" style="margin-right: 6px; color: #FFA726;"></i> Светла тема
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="theme" id="theme-dark" value="dark">
                <label class="form-check-label" for="theme-dark">
                  <i class="fas fa-moon" style="margin-right: 6px; color: #42A5F5;"></i> Тъмна тема
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- About Card -->
        <div class="card shadow-sm">
          <div class="card-header" style="background: linear-gradient(135deg, #90A4AE 0%, #78909C 100%); color: white;">
            <h5 class="mb-0"><i class="fas fa-info-circle" style="font-size: 20px; margin-right: 8px;"></i> Информация</h5>
          </div>
          <div class="card-body">
            <p><strong><i class="fas fa-laptop" style="margin-right: 6px;"></i> Приложение:</strong> Medical Schedule</p>
            <p><strong><i class="fas fa-tag" style="margin-right: 6px;"></i> Версия:</strong> 1.0.0</p>
            <p><strong><i class="fas fa-tools" style="margin-right: 6px;"></i> Построено с:</strong> HTML, CSS, JavaScript, Vite, Bootstrap, Supabase</p>
          </div>
        </div>
      </div>
    </div>
  `
}

function setupSettingsHandlers(currentUser, container) {
  // Setup theme switcher
  const themeLight = container.querySelector('#theme-light')
  const themeDark = container.querySelector('#theme-dark')
  
  // Load saved theme (per-profile) and apply
  const savedTheme = loadAndApplyThemeForUser(currentUser)
  if (savedTheme === 'dark') {
    themeDark.checked = true
  } else {
    themeLight.checked = true
  }
  
  // Handle theme change
  const handleThemeChange = (e) => {
    const theme = e.target.value
    saveThemeForUser(currentUser, theme)

    // Persist to Supabase Auth metadata for cross-device sync (best-effort)
    ;(async () => {
      try {
        const { error } = await supabase.auth.updateUser({ data: { theme } })
        if (error) {
          console.warn('Failed to persist theme to auth metadata:', error.message)
        }
      } catch (err) {
        console.warn('Failed to persist theme to auth metadata:', err?.message || err)
      }
    })()

    // Persist to Supabase profile for cross-device sync (best-effort)
    ;(async () => {
      let updated = null
      try {
        // Try doctor first, then patient
        updated = await updateDoctor(currentUser.email, { theme })
      } catch {
        // ignore and try patient
      }

      if (updated) return

      try {
        await updatePatient(currentUser.email, { theme })
      } catch {
        // ignore (e.g., profile not created yet, or DB not migrated)
      }
    })()
  }
  
  themeLight.addEventListener('change', handleThemeChange)
  themeDark.addEventListener('change', handleThemeChange)
  
  // Load user profile data
  setTimeout(async () => {
    const profileCard = container.querySelector('#profile-card')
    if (!profileCard) return
    
    try {
      const userEmail = currentUser.email
      
      console.log('Attempting to load profile for email:', userEmail)
      
      // Try to get doctor data first
      let userData = await getDoctorByEmail(userEmail)
      let userType = 'doctor'
      
      console.log('Doctor data:', userData)
      
      // If not a doctor, try to get patient data
      if (!userData) {
        userData = await getPatientByEmail(userEmail)
        userType = 'patient'
        console.log('Patient data:', userData)
      }
      
      if (!userData) {
        const profileCard = container.querySelector('#profile-card')
        if (profileCard) {
          profileCard.querySelector('.card-body').innerHTML = `
            <div class="alert alert-warning">
              <h6>⚠️ Профилът не е регистриран</h6>
              <p>Вашият профил не е намерен в системата. Моля изберете тип профил:</p>
              <div class="mt-3">
                <button class="btn btn-primary me-2" id="create-doctor-btn">
                  <i class="fas fa-user-md" style="margin-right: 8px;"></i> Аз съм лекар
                </button>
                <button class="btn btn-success" id="create-patient-btn">
                  <i class="fas fa-user" style="margin-right: 8px;"></i> Аз съм пациент
                </button>
              </div>
            </div>
          `
          
          // Handle doctor profile creation
          document.getElementById('create-doctor-btn').addEventListener('click', async () => {
            await createUserProfile(userEmail, 'doctor', profileCard, container)
          })
          
          // Handle patient profile creation
          document.getElementById('create-patient-btn').addEventListener('click', async () => {
            await createUserProfile(userEmail, 'patient', profileCard, container)
          })
        }
        return
      }
      
      // Build form HTML
      let formHTML = `
        <form id="profile-form">
          <div class="mb-3">
            <label for="email" class="form-label"><strong>Email</strong></label>
            <input type="email" class="form-control" id="email" value="${userData.email}" disabled>
            <small class="text-muted">Email адресът не може да се променя</small>
          </div>
          
          <div class="mb-3">
            <label for="name" class="form-label"><strong>Име</strong></label>
            <input type="text" class="form-control" id="name" value="${userData.name || ''}" required>
          </div>
      `
      
      // Add doctor-specific fields
      if (userType === 'doctor') {
        const avatarPreview = renderDoctorAvatarImg(userData, 72)
        formHTML += `
          <div class="mb-4">
            <label class="form-label"><strong>Профилна снимка</strong></label>
            <div class="d-flex align-items-center gap-3">
              <div id="doctor-avatar-preview" style="min-width: 72px; min-height: 72px; display: flex; align-items: center; justify-content: center;">
                ${avatarPreview || '<i class="fas fa-user-doctor" style="font-size: 48px; color: #4FC3F7;"></i>'}
              </div>
              <div class="flex-grow-1">
                <input type="file" class="form-control" id="doctor-avatar-file" accept="image/png,image/jpeg,image/webp">
                <div class="d-flex gap-2 mt-2">
                  <button type="button" class="btn btn-outline-primary btn-sm" id="upload-avatar-btn">
                    <i class="fas fa-upload" style="margin-right: 6px;"></i> Качи
                  </button>
                  <button type="button" class="btn btn-outline-danger btn-sm" id="delete-avatar-btn" ${userData.avatar_path ? '' : 'disabled'}>
                    <i class="fas fa-trash" style="margin-right: 6px;"></i> Изтрий
                  </button>
                </div>
                <small class="text-muted">PNG/JPG/WebP, препоръчително квадратна снимка.</small>
                <div id="avatar-message" class="mt-2"></div>
              </div>
            </div>
          </div>
        `

        formHTML += `
          <div class="mb-3">
            <label for="specialty" class="form-label"><strong>Специалност</strong></label>
            <input type="text" class="form-control" id="specialty" value="${userData.specialty || ''}">
          </div>
          
          <div class="mb-3">
            <label for="phone" class="form-label"><strong>Телефон</strong></label>
            <input type="tel" class="form-control" id="phone" value="${userData.phone || ''}" placeholder="+359...">
          </div>
          
          <div class="mb-3">
            <label for="address" class="form-label"><strong>Адрес на практиката</strong></label>
            <input type="text" class="form-control" id="address" value="${userData.address || ''}" placeholder="гр. София, ул. ...">
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <label for="work_hours_from" class="form-label"><strong>Начало на работното време</strong></label>
                <input type="time" class="form-control" id="work_hours_from" value="${userData.work_hours_from || '08:00'}" required>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <label for="work_hours_to" class="form-label"><strong>Край на работното време</strong></label>
                <input type="time" class="form-control" id="work_hours_to" value="${userData.work_hours_to || '17:00'}" required>
              </div>
            </div>
          </div>
        `
      }
      
      formHTML += `
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save" style="margin-right: 6px;"></i> Запиши промените
            </button>
            <button type="button" class="btn btn-secondary" id="logout-btn">
              <i class="fas fa-sign-out-alt" style="margin-right: 6px;"></i> Изход
            </button>
          </div>
          <div id="message-container"></div>
        </form>
      `
      
      profileCard.querySelector('.card-body').innerHTML = formHTML

      // Doctor avatar upload/delete handlers (doctor only)
      if (userType === 'doctor') {
        setupDoctorAvatarHandlers(currentUser, userData, userEmail, profileCard)
      }
      
      // Handle form submission
      const form = profileCard.querySelector('#profile-form')
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const messageContainer = profileCard.querySelector('#message-container')
        const submitBtn = form.querySelector('button[type="submit"]')
        
        try {
          submitBtn.disabled = true
          const formData = {
            name: document.getElementById('name').value
          }
          
          if (userType === 'doctor') {
            formData.specialty = document.getElementById('specialty').value
            formData.phone = document.getElementById('phone').value
            formData.address = document.getElementById('address').value
            formData.work_hours_from = document.getElementById('work_hours_from').value
            formData.work_hours_to = document.getElementById('work_hours_to').value
          }
          
          if (userType === 'doctor') {
            await updateDoctor(userEmail, formData)
            eventBus.emit(EVENTS.DOCTOR_UPDATED, formData)
          } else {
            await updatePatient(userEmail, formData)
            eventBus.emit(EVENTS.PATIENT_UPDATED, formData)
          }
          
          // Emit general profile update event
          eventBus.emit(EVENTS.PROFILE_UPDATED, { userEmail, userType, ...formData })
          
          messageContainer.innerHTML = `
            <div class="alert alert-success mt-3">
              <i class="fas fa-check-circle" style="margin-right: 6px;"></i> Промените са запазени успешно!
            </div>
          `
          
          setTimeout(() => {
            messageContainer.innerHTML = ''
          }, 3000)
        } catch (error) {
          console.error('Error updating profile:', error)
          messageContainer.innerHTML = `
            <div class="alert alert-danger mt-3">
              <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i> Възникна грешка при запазване на промените.
            </div>
          `
        } finally {
          submitBtn.disabled = false
        }
      })
      
      // Handle logout
      const logoutBtn = container.querySelector('#logout-btn')
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          try {
            await logout()
            navigateTo('/home')
          } catch (error) {
            console.error('Logout error:', error)
          }
        })
      }
      
    } catch (error) {
      console.error('Error loading profile:', error)
      const profileCard = container.querySelector('#profile-card')
      if (profileCard) {
        profileCard.querySelector('.card-body').innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i> Неуспешно зареждане на профила. Проверете конзолата за детайли.
          </div>
        `
      }
    }
  }, 0)
}

function setupDoctorAvatarHandlers(currentUser, userData, userEmail, profileCard) {
  const fileInput = profileCard.querySelector('#doctor-avatar-file')
  const uploadBtn = profileCard.querySelector('#upload-avatar-btn')
  const deleteBtn = profileCard.querySelector('#delete-avatar-btn')
  const preview = profileCard.querySelector('#doctor-avatar-preview')
  const message = profileCard.querySelector('#avatar-message')

  if (!fileInput || !uploadBtn || !deleteBtn || !preview || !message) return

  const setMessage = (html) => {
    message.innerHTML = html
  }

  const refreshPreview = () => {
    const img = renderDoctorAvatarImg(userData, 72)
    preview.innerHTML = img || '<i class="fas fa-user-doctor" style="font-size: 48px; color: #4FC3F7;"></i>'
    deleteBtn.disabled = !userData.avatar_path
  }

  const detectExt = (file) => {
    const map = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    }
    if (map[file.type]) return map[file.type]
    const name = file.name || ''
    const parts = name.split('.')
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : ''
    return ext || 'jpg'
  }

  uploadBtn.addEventListener('click', async () => {
    try {
      setMessage('')
      const file = fileInput.files?.[0]
      if (!file) {
        setMessage('<div class="alert alert-warning py-2 mb-0">Изберете файл за качване.</div>')
        return
      }

      if (!file.type?.startsWith('image/')) {
        setMessage('<div class="alert alert-warning py-2 mb-0">Файлът трябва да е изображение.</div>')
        return
      }

      const maxBytes = 5 * 1024 * 1024
      if (file.size > maxBytes) {
        setMessage('<div class="alert alert-warning py-2 mb-0">Файлът е твърде голям (макс. 5MB).</div>')
        return
      }

      uploadBtn.disabled = true
      deleteBtn.disabled = true

      const ext = detectExt(file)
      const path = `${currentUser.id}/avatar.${ext}`

      const { error: uploadError } = await supabase
        .storage
        .from(DOCTOR_AVATARS_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600'
        })
      if (uploadError) throw uploadError

      const nowIso = new Date().toISOString()
      await updateDoctor(userEmail, { avatar_path: path, avatar_updated_at: nowIso })

      userData.avatar_path = path
      userData.avatar_updated_at = nowIso

      refreshPreview()
      setMessage('<div class="alert alert-success py-2 mb-0">Снимката е качена успешно.</div>')
      eventBus.emit(EVENTS.DOCTOR_UPDATED, { avatar_path: path, avatar_updated_at: nowIso })
    } catch (error) {
      console.error('Avatar upload error:', error)
      setMessage(`<div class="alert alert-danger py-2 mb-0">Грешка при качване: ${error.message || 'неуспешно'}.</div>`)
      refreshPreview()
    } finally {
      uploadBtn.disabled = false
    }
  })

  deleteBtn.addEventListener('click', async () => {
    try {
      setMessage('')
      if (!userData.avatar_path) return

      uploadBtn.disabled = true
      deleteBtn.disabled = true

      const { error: removeError } = await supabase
        .storage
        .from(DOCTOR_AVATARS_BUCKET)
        .remove([userData.avatar_path])

      // Even if the object is already missing, clear DB pointer.
      const nowIso = new Date().toISOString()
      await updateDoctor(userEmail, { avatar_path: null, avatar_updated_at: nowIso })

      userData.avatar_path = null
      userData.avatar_updated_at = nowIso

      refreshPreview()

      if (removeError) {
        setMessage('<div class="alert alert-warning py-2 mb-0">Снимката е премахната от профила, но файлът не можа да се изтрие от storage.</div>')
      } else {
        setMessage('<div class="alert alert-success py-2 mb-0">Снимката е изтрита успешно.</div>')
      }

      eventBus.emit(EVENTS.DOCTOR_UPDATED, { avatar_path: null, avatar_updated_at: nowIso })
    } catch (error) {
      console.error('Avatar delete error:', error)
      setMessage(`<div class="alert alert-danger py-2 mb-0">Грешка при изтриване: ${error.message || 'неуспешно'}.</div>`)
      refreshPreview()
    } finally {
      uploadBtn.disabled = false
      deleteBtn.disabled = !userData.avatar_path
    }
  })
}

async function createUserProfile(email, userType, profileCard, container) {
  try {
    profileCard.querySelector('.card-body').innerHTML = `
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Зареждане...</span>
      </div>
    `
    
    if (userType === 'doctor') {
      // Create doctor profile with default values
      await createDoctor({
        name: email.split('@')[0],
        specialty: 'Неопределена',
        phone: '',
        address: '',
        email: email,
        work_hours_from: '08:00',
        work_hours_to: '17:00'
      })
    } else {
      // Create patient profile
      await createPatient({
        name: email.split('@')[0],
        email: email
      })
    }
    
    // Reload the settings form using the active session user
    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const html = buildSettingsHTML(user)
        container.innerHTML = html
        setupSettingsHandlers(user, container)
      }
    }, 500)
    
  } catch (error) {
    console.error('Error creating profile:', error)
    profileCard.querySelector('.card-body').innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i> Грешка при създаване на профила: ${error.message}
      </div>
    `
  }
}
