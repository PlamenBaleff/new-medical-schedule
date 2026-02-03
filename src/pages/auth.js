import { supabase } from '../services/supabase.js'
import {
  savePendingProfile,
  clearPendingProfile,
  ensureProfileForAuthUser
} from '../services/pendingProfile.js'

export default function AuthPage() {
  const container = document.createElement('div')
  container.className = 'container py-4'

  container.innerHTML = `
    <div id="auth-user-panel" class="card shadow-sm mb-3" style="display: none;">
      <div class="card-header" style="background: linear-gradient(135deg, #ECEFF1 0%, #CFD8DC 100%); color: #263238;">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="fas fa-user-check" style="font-size: 20px; margin-right: 8px;"></i> Профил</h5>
          <button class="btn btn-sm btn-outline-dark" type="button" id="auth-logout-btn">
            <i class="fas fa-sign-out-alt" style="margin-right: 6px;"></i> Изход
          </button>
        </div>
      </div>
      <div class="card-body">
        <div id="auth-user-info"></div>
      </div>
    </div>
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div id="auth-panel" class="card shadow-sm">
          <div class="card-header" style="background: linear-gradient(135deg, #81C784 0%, #66BB6A 100%); color: white;">
            <h5 class="mb-0"><i class="fas fa-user-circle" style="font-size: 20px; margin-right: 8px;"></i> Вход / Регистрация</h5>
          </div>
          <div class="card-body">
            <!-- User Type Selection -->
            <div id="user-type-selection">
              <div class="text-center mb-4">
                <h6>Изберете вашия тип профил:</h6>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <button class="btn btn-primary btn-lg w-100" onclick="window.showAuthForm('doctor')">
                    <i class="fas fa-user-md" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                    Регистрация като лекар
                  </button>
                </div>
                <div class="col-md-6">
                  <button class="btn btn-success btn-lg w-100" onclick="window.showAuthForm('patient')">
                    <i class="fas fa-user" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                    Регистрация като пациент
                  </button>
                </div>
              </div>
              <div class="text-center mt-4">
                <p class="text-muted">Вече имате профил?</p>
                <button class="btn btn-outline-secondary" onclick="window.showLoginForm()">
                  <i class="fas fa-sign-in-alt" style="margin-right: 8px;"></i> Вход
                </button>
              </div>
            </div>

            <!-- Doctor Registration Form -->
            <div id="doctor-register-form" style="display: none;">
              <h6 class="mb-3">Регистрация на нов лекар</h6>
              <form id="doctor-reg-form">
                <div class="mb-3">
                  <label class="form-label">Име</label>
                  <input type="text" class="form-control" id="doctor-name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Специалност</label>
                  <input type="text" class="form-control" id="doctor-specialty" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Телефон</label>
                  <input type="tel" class="form-control" id="doctor-phone" placeholder="+359...">
                </div>
                <div class="mb-3">
                  <label class="form-label">Адрес на практиката</label>
                  <input type="text" class="form-control" id="doctor-address" placeholder="гр. София, ул. ...">
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="doctor-email" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Парола</label>
                  <input type="password" class="form-control" id="doctor-password" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Работни часове (от)</label>
                  <input type="time" class="form-control" id="doctor-hours-from" value="08:00" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Работни часове (до)</label>
                  <input type="time" class="form-control" id="doctor-hours-to" value="17:00" required>
                </div>
                <div class="form-check mb-3">
                  <input class="form-check-input" type="checkbox" id="doctor-request-admin">
                  <label class="form-check-label" for="doctor-request-admin">
                    Желая администраторски достъп (изисква одобрение)
                  </label>
                  <div class="form-text">Само лекари могат да подават заявка за админ.</div>
                </div>
                <button type="submit" class="btn btn-primary">Регистрирай се</button>
                <button type="button" class="btn btn-secondary" onclick="window.showUserTypeSelection()">Назад</button>
              </form>
            </div>

            <!-- Patient Registration Form -->
            <div id="patient-register-form" style="display: none;">
              <h6 class="mb-3">Регистрация на пациент</h6>
              <form id="patient-reg-form">
                <div class="mb-3">
                  <label class="form-label">Име</label>
                  <input type="text" class="form-control" id="patient-name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Телефон</label>
                  <input type="tel" class="form-control" id="patient-phone" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="patient-email" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Парола</label>
                  <input type="password" class="form-control" id="patient-password" required>
                </div>
                <button type="submit" class="btn btn-info">Регистрирай се</button>
                <button type="button" class="btn btn-secondary" onclick="window.showUserTypeSelection()">Назад</button>
              </form>
            </div>

            <!-- Login Form -->
            <div id="login-form" style="display: none;">
              <h6 class="mb-3">Вход в системата</h6>
              <form id="login-form-element">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="login-email" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Парола</label>
                  <input type="password" class="form-control" id="login-password" required>
                </div>
                <button type="submit" class="btn btn-success">Влез</button>
                <button type="button" class="btn btn-secondary" onclick="window.showUserTypeSelection()">Назад</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  setTimeout(() => {
    setupEventListeners()
    window.showUserTypeSelection()
    checkUserSession()
  }, 0)

  return container
}

async function checkUserSession() {
  const { data: { user } } = await supabase.auth.getUser()
  const authPanel = document.getElementById('auth-panel')
  const userPanel = document.getElementById('auth-user-panel')
  const userInfo = document.getElementById('auth-user-info')

  if (!user) {
    if (authPanel) authPanel.style.display = 'block'
    if (userPanel) userPanel.style.display = 'none'
    return
  }

  await ensureProfileForAuthUser(user)

  const { data: adminData } = await supabase
    .from('admins')
    .select('id, email, name, is_active, created_at')
    .eq('email', user.email)
    .eq('is_active', true)
    .maybeSingle()

  if (adminData) {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('name')
      .eq('email', user.email)
      .maybeSingle()
    const displayName = doctor?.name || adminData.name || user.email
    if (authPanel) authPanel.style.display = 'none'
    if (userPanel) userPanel.style.display = 'block'
    if (userInfo) {
      userInfo.innerHTML = `
        <div class="alert alert-danger mb-3">
          <i class="fas fa-shield-alt"></i> <strong>Администраторски достъп</strong>
        </div>
        <h5>Добре дошли, ${displayName}!</h5>
        <p><strong>Email:</strong> ${user.email}</p>
      `
    }
    return
  }

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()

  if (doctor) {
    if (authPanel) authPanel.style.display = 'none'
    if (userPanel) userPanel.style.display = 'block'
    if (userInfo) {
      userInfo.innerHTML = `
        <h5>Добре дошли, д-р ${doctor.name}!</h5>
        <p><strong>Специалност:</strong> ${doctor.specialty || '-'}</p>
        <p><strong>Email:</strong> ${doctor.email}</p>
        <p><strong>Телефон:</strong> ${doctor.phone || 'Не е посочен'}</p>
        <p><strong>Адрес:</strong> ${doctor.address || 'Не е посочен'}</p>
        <p><strong>Работни часове:</strong> ${doctor.work_hours_from} - ${doctor.work_hours_to}</p>
      `
    }
    return
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, phone, email, created_at')
    .eq('email', user.email)
    .maybeSingle()

  if (patient) {
    if (authPanel) authPanel.style.display = 'none'
    if (userPanel) userPanel.style.display = 'block'
    if (userInfo) {
      userInfo.innerHTML = `
        <h5>Добре дошли, ${patient.name}!</h5>
        <p><strong>Email:</strong> ${patient.email}</p>
        <p><strong>Телефон:</strong> ${patient.phone}</p>
      `
    }
    return
  }

  if (authPanel) authPanel.style.display = 'block'
  if (userPanel) userPanel.style.display = 'none'
}

function setupEventListeners() {
  const logoutBtn = document.getElementById('auth-logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logoutAuth()
    })
  }

  const doctorForm = document.getElementById('doctor-reg-form')
  if (doctorForm) {
    doctorForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await registerDoctor()
    })
  }

  const patientForm = document.getElementById('patient-reg-form')
  if (patientForm) {
    patientForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await registerPatient()
    })
  }

  const loginForm = document.getElementById('login-form-element')
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await login()
    })
  }
}

async function registerDoctor() {
  const name = document.getElementById('doctor-name').value
  const specialty = document.getElementById('doctor-specialty').value
  const phone = document.getElementById('doctor-phone').value
  const address = document.getElementById('doctor-address').value
  const email = document.getElementById('doctor-email').value
  const password = document.getElementById('doctor-password').value
  const hoursFrom = document.getElementById('doctor-hours-from').value
  const hoursTo = document.getElementById('doctor-hours-to').value
  const wantsAdmin = document.getElementById('doctor-request-admin').checked
  const pendingProfile = {
    email,
    user_type: 'doctor',
    profile: {
      name,
      specialty,
      phone,
      address,
      email,
      work_hours_from: hoursFrom,
      work_hours_to: hoursTo
    }
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (authError) throw authError

    if (!authData.session) {
      savePendingProfile(pendingProfile)
      alert('Регистрацията е успешна! Потвърдете имейла и влезте в системата. Профилът ще се създаде автоматично.')
      window.showLoginForm()
      return
    }

    const doctorPayload = {
      name: name,
      specialty: specialty,
      email: email,
      work_hours_from: hoursFrom,
      work_hours_to: hoursTo
    }
    if (phone) doctorPayload.phone = phone
    if (address) doctorPayload.address = address

    let { data, error } = await supabase
      .from('doctors')
      .insert([doctorPayload])
      .select('*')

    if (error && /column .*phone|column .*address/i.test(error.message)) {
      const fallbackPayload = { ...doctorPayload }
      delete fallbackPayload.phone
      delete fallbackPayload.address
      const retry = await supabase
        .from('doctors')
        .insert([fallbackPayload])
        .select('*')
      data = retry.data
      error = retry.error
    }

    if (error) {
      savePendingProfile(pendingProfile)
      throw error
    }

    await supabase.auth.signOut()

    if (wantsAdmin) {
      const { error: requestError } = await supabase
        .from('admin_requests')
        .insert([{
          doctor_id: data[0].id,
          email: email,
          name: name,
          specialty: specialty,
          status: 'pending'
        }])
        .select('id')

      if (requestError) throw requestError
      alert('Регистрацията е успешна! Заявката за админ е изпратена и чака одобрение.')
    } else {
      alert('Регистрацията е успешна! Моля, влезте в системата.')
    }
    clearPendingProfile(email)
    window.showLoginForm()
  } catch (error) {
    console.error('Error registering doctor:', error)
    alert('Грешка при регистрация: ' + error.message)
  }
}

async function registerPatient() {
  const name = document.getElementById('patient-name').value
  const phone = document.getElementById('patient-phone').value
  const email = document.getElementById('patient-email').value
  const password = document.getElementById('patient-password').value
  const pendingProfile = {
    email,
    user_type: 'patient',
    profile: {
      name,
      phone,
      email
    }
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (authError) throw authError

    if (!authData.session) {
      savePendingProfile(pendingProfile)
      alert('Регистрацията е успешна! Потвърдете имейла и влезте в системата. Профилът ще се създаде автоматично.')
      window.showLoginForm()
      return
    }

    const { error } = await supabase
      .from('patients')
      .insert([{
        name: name,
        phone: phone,
        email: email
      }])
      .select('id, name, phone, email, created_at')

    if (error) {
      savePendingProfile(pendingProfile)
      throw error
    }

    await supabase.auth.signOut()

    clearPendingProfile(email)
    alert('Регистрацията е успешна! Моля, влезте в системата.')
    window.showLoginForm()
  } catch (error) {
    console.error('Error registering patient:', error)
    alert('Грешка при регистрация: ' + error.message)
  }
}

async function login() {
  const email = document.getElementById('login-email').value
  const password = document.getElementById('login-password').value

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) throw error
    await ensureProfileForAuthUser(data.user)
    await checkUserSession()
  } catch (error) {
    console.error('Error logging in:', error)
    alert('Грешка при вход: ' + error.message)
  }
}

window.showAuthForm = (type) => {
  const userTypeSelection = document.getElementById('user-type-selection')
  const doctorForm = document.getElementById('doctor-register-form')
  const patientForm = document.getElementById('patient-register-form')
  const loginForm = document.getElementById('login-form')

  if (userTypeSelection) userTypeSelection.style.display = 'none'
  if (doctorForm) doctorForm.style.display = type === 'doctor' ? 'block' : 'none'
  if (patientForm) patientForm.style.display = type === 'patient' ? 'block' : 'none'
  if (loginForm) loginForm.style.display = 'none'
}

window.showLoginForm = () => {
  const userTypeSelection = document.getElementById('user-type-selection')
  const doctorForm = document.getElementById('doctor-register-form')
  const patientForm = document.getElementById('patient-register-form')
  const loginForm = document.getElementById('login-form')

  if (userTypeSelection) userTypeSelection.style.display = 'none'
  if (doctorForm) doctorForm.style.display = 'none'
  if (patientForm) patientForm.style.display = 'none'
  if (loginForm) loginForm.style.display = 'block'
}

window.showUserTypeSelection = () => {
  const userTypeSelection = document.getElementById('user-type-selection')
  const doctorForm = document.getElementById('doctor-register-form')
  const patientForm = document.getElementById('patient-register-form')
  const loginForm = document.getElementById('login-form')

  if (userTypeSelection) userTypeSelection.style.display = 'block'
  if (doctorForm) doctorForm.style.display = 'none'
  if (patientForm) patientForm.style.display = 'none'
  if (loginForm) loginForm.style.display = 'none'
}

async function logoutAuth() {
  await supabase.auth.signOut()
  const authPanel = document.getElementById('auth-panel')
  const userPanel = document.getElementById('auth-user-panel')
  if (authPanel) authPanel.style.display = 'block'
  if (userPanel) userPanel.style.display = 'none'
  window.showUserTypeSelection()
}
