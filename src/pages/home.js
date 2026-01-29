// Home page component
import { supabase } from '../services/supabase.js'
import { eventBus, EVENTS } from '../services/eventBus.js'

let selectedDoctor = null
let currentUser = null
let isAdmin = false

export default function HomePage() {
  const container = document.createElement('div')
  container.className = 'container-fluid py-4'
  
  container.innerHTML = `
    <div class="row g-4">
      <!-- Left Column - Doctors List -->
      <div class="col-lg-4">
        <div class="card shadow-sm">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-people-fill"></i> Списък с лекари</h5>
          </div>
          <div class="card-body p-0">
            <div id="doctors-list" class="list-group list-group-flush">
              <div class="text-center p-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar Section (below doctors list) -->
        <div id="calendar-section" class="card shadow-sm mt-3" style="display: none;">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0"><i class="bi bi-calendar3"></i> График на <span id="doctor-name-header"></span></h5>
          </div>
          <div class="card-body">
            <div id="calendar-container"></div>
          </div>
        </div>
      </div>

      <!-- Right Column - Login/Registration Panel -->
      <div class="col-lg-8">
        <!-- Auth Panel (shown when not logged in) -->
        <div id="auth-panel" class="card shadow-sm">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0"><i class="bi bi-person-circle"></i> Вход / Регистрация</h5>
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
                    <i class="bi bi-person-badge"></i><br>
                    Регистрация като лекар
                  </button>
                </div>
                <div class="col-md-6">
                  <button class="btn btn-info btn-lg w-100" onclick="window.showAuthForm('patient')">
                    <i class="bi bi-person"></i><br>
                    Регистрация като пациент
                  </button>
                </div>
              </div>
              <div class="text-center mt-4">
                <p class="text-muted">Вече имате профил?</p>
                <button class="btn btn-outline-secondary" onclick="window.showLoginForm()">
                  <i class="bi bi-box-arrow-in-right"></i> Вход
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

        <!-- User Panel (shown when logged in) -->
        <div id="user-panel" class="card shadow-sm" style="display: none;">
          <div class="card-header bg-dark text-white">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-person-check"></i> Профил</h5>
              <button class="btn btn-sm btn-outline-light" onclick="window.logout()">
                <i class="bi bi-box-arrow-right"></i> Изход
              </button>
            </div>
          </div>
          <div class="card-body">
            <div id="user-info"></div>
          </div>
        </div>

        <!-- Appointment Booking Panel (for patients) -->
        <div id="booking-panel" class="card shadow-sm mt-3" style="display: none;">
          <div class="card-header bg-warning">
            <h5 class="mb-0"><i class="bi bi-calendar-plus"></i> Запиши час</h5>
          </div>
          <div class="card-body">
            <div id="booking-form-container"></div>
          </div>
        </div>
      </div>
    </div>
  `
  
  // Initialize the page
  setTimeout(() => {
    initializePage()
  }, 0)
  
  return container
}

async function initializePage() {
  loadDoctors()
  checkUserSession()
  setupEventListeners()
  
  // Listen for doctor updates and reload doctors list
  eventBus.on(EVENTS.DOCTOR_UPDATED, () => {
    loadDoctors()
    // Reload calendar if a doctor is selected
    if (selectedDoctor) {
      loadDoctorCalendar(selectedDoctor)
    }
  })
}

async function loadDoctors() {
  const doctorsList = document.getElementById('doctors-list')
  
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('id, name, specialty, email, work_hours_from, work_hours_to, created_at')
      .order('name')
    
    if (error) {
      console.warn('Supabase error (RLS policy issue):', error.message)
      // Even if there's an error, doctors might still load with public access
      // So we don't throw, we continue
      if (!doctors || doctors.length === 0) {
        throw error
      }
    }
    
    if (doctors && doctors.length > 0) {
      renderDoctorsList(doctors, doctorsList)
      return // Successfully loaded, no need for demo data
    } else {
      doctorsList.innerHTML = '<div class="p-3 text-center text-muted">Няма регистрирани лекари. Регистрирайте се като лекар, за да се появите в списъка.</div>'
    }
  } catch (error) {
    console.error('Error loading doctors from database:', error.message)
    
    // Show demo doctors only if Supabase completely fails
    const demoDoctors = [
      {
        id: 'demo-1',
        name: 'Д-р Иван Петров',
        specialty: 'Кардиолог',
        email: 'demo@example.com',
        work_hours_from: '09:00',
        work_hours_to: '17:00'
      },
      {
        id: 'demo-2',
        name: 'Д-р Мария Димитрова',
        specialty: 'Дерматолог',
        email: 'demo2@example.com',
        work_hours_from: '08:00',
        work_hours_to: '16:00'
      },
      {
        id: 'demo-3',
        name: 'Д-р Георги Стоянов',
        specialty: 'Хирург',
        email: 'demo3@example.com',
        work_hours_from: '10:00',
        work_hours_to: '18:00'
      }
    ]
    
    // Only show warning if we're actually using demo data
    doctorsList.innerHTML = `
      <div class="alert alert-warning m-2">
        <small><i class="bi bi-exclamation-triangle"></i> Supabase връзка временно недостъпна. Показват се демо данни.</small>
      </div>
    `
    renderDoctorsList(demoDoctors, doctorsList)
  }
}

function renderDoctorsList(doctors, container) {
  const doctorsHTML = doctors.map(doctor => `
    <a href="#" class="list-group-item list-group-item-action doctor-item" data-doctor-id="${doctor.id}">
      <div class="d-flex w-100 justify-content-between">
        <h6 class="mb-1"><i class="bi bi-person-badge"></i> ${doctor.name}</h6>
        <small class="text-success"><i class="bi bi-circle-fill"></i></small>
      </div>
      <small class="text-muted">${doctor.specialty || 'Лекар'}</small>
    </a>
  `).join('')
  
  // Append to existing content or replace
  if (container.querySelector('.alert')) {
    container.innerHTML += doctorsHTML
  } else {
    container.innerHTML = doctorsHTML
  }
  
  // Add click handlers
  document.querySelectorAll('.doctor-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const doctorId = item.dataset.doctorId
      selectDoctor(doctorId, doctors)
    })
  })
}

async function selectDoctor(doctorId, doctors) {
  const doctor = doctors.find(d => d.id === doctorId)
  if (!doctor) return
  
  selectedDoctor = doctor
  
  // Highlight selected doctor
  document.querySelectorAll('.doctor-item').forEach(item => {
    item.classList.remove('active')
  })
  document.querySelector(`[data-doctor-id="${doctorId}"]`).classList.add('active')
  
  // Show calendar
  const calendarSection = document.getElementById('calendar-section')
  const doctorNameHeader = document.getElementById('doctor-name-header')
  doctorNameHeader.textContent = doctor.name
  calendarSection.style.display = 'block'
  
  // Load calendar
  await loadDoctorCalendar(doctor)
  
  // If patient is logged in, show booking panel
  if (currentUser && currentUser.user_type === 'patient') {
    showBookingPanel(doctor)
  }
}

async function loadDoctorCalendar(doctor) {
  const calendarContainer = document.getElementById('calendar-container')
  
  // Generate week view
  const today = new Date()
  const weekDays = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    weekDays.push(date)
  }
  
  // Load appointments for this doctor
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at')
    .eq('doctor_id', doctor.id)
    .gte('appointment_date', today.toISOString().split('T')[0])
  
  const appointmentMap = {}
  if (appointments) {
    appointments.forEach(apt => {
      const key = `${apt.appointment_date}_${apt.appointment_time}`
      appointmentMap[key] = apt
    })
  }
  
  // Generate calendar HTML
  let calendarHTML = '<div class="calendar-week">'
  
  weekDays.forEach(date => {
    const dateStr = date.toISOString().split('T')[0]
    const dayName = date.toLocaleDateString('bg-BG', { weekday: 'short' })
    const dayNum = date.getDate()
    
    calendarHTML += `
      <div class="calendar-day mb-3">
        <div class="fw-bold text-center mb-2 bg-light p-2 rounded">${dayName} ${dayNum}</div>
        <div class="time-slots">
    `
    
    // Generate time slots (9:00 - 17:00)
    const workHoursFrom = doctor.work_hours_from || '08:00'
    const workHoursTo = doctor.work_hours_to || '17:00'
    
    const startHour = parseInt(workHoursFrom.split(':')[0])
    const endHour = parseInt(workHoursTo.split(':')[0])
    
    for (let hour = startHour; hour < endHour; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`
      const key = `${dateStr}_${timeStr}`
      const isBooked = appointmentMap[key]
      
      const statusClass = isBooked ? 'btn-danger' : 'btn-success'
      const statusText = isBooked ? 'Зает' : 'Свободен'
      const statusIcon = isBooked ? 'x-circle' : 'check-circle'
      
      calendarHTML += `
        <button class="btn ${statusClass} btn-sm w-100 mb-1 time-slot" 
                data-date="${dateStr}" 
                data-time="${timeStr}"
                ${isBooked ? 'disabled' : ''}>
          <i class="bi bi-${statusIcon}"></i> ${timeStr} - ${statusText}
        </button>
      `
    }
    
    calendarHTML += `
        </div>
      </div>
    `
  })
  
  calendarHTML += '</div>'
  calendarContainer.innerHTML = calendarHTML
  
  // Add click handlers for time slots (only for logged in patients)
  if (currentUser && currentUser.user_type === 'patient') {
    document.querySelectorAll('.time-slot:not([disabled])').forEach(slot => {
      slot.addEventListener('click', () => {
        const date = slot.dataset.date
        const time = slot.dataset.time
        showBookingForm(doctor, date, time)
      })
    })
  }
}

function showBookingPanel(doctor) {
  const bookingPanel = document.getElementById('booking-panel')
  bookingPanel.style.display = 'block'
}

function showBookingForm(doctor, date, time) {
  const bookingFormContainer = document.getElementById('booking-form-container')
  
  bookingFormContainer.innerHTML = `
    <h6>Запиши час при ${doctor.name}</h6>
    <p class="text-muted">Дата: ${date}, Час: ${time}</p>
    <form id="booking-form">
      <div class="mb-3">
        <label class="form-label">Оплаквания / Причина за посещението</label>
        <textarea class="form-control" id="booking-complaints" rows="4" required 
                  placeholder="Опишете накратко оплакванията си..."></textarea>
      </div>
      <button type="submit" class="btn btn-warning">Потвърди запис</button>
    </form>
  `
  
  document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    await createAppointment(doctor.id, date, time)
  })
}

async function createAppointment(doctorId, date, time) {
  const complaints = document.getElementById('booking-complaints').value
  
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        doctor_id: doctorId,
        patient_id: currentUser.id,
        appointment_date: date,
        appointment_time: time,
        complaints: complaints,
        status: 'scheduled'
      }])
    
    if (error) throw error
    
    alert('Часът е записан успешно!')
    loadDoctorCalendar(selectedDoctor)
    document.getElementById('booking-form-container').innerHTML = '<div class="alert alert-success">Успешно записан час!</div>'
  } catch (error) {
    console.error('Error creating appointment:', error)
    alert('Грешка при записване на час: ' + error.message)
  }
}

async function checkUserSession() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id, email, name, is_active, created_at')
      .eq('email', user.email)
      .eq('is_active', true)
      .maybeSingle()
    
    if (adminData) {
      isAdmin = true
      currentUser = { ...adminData, user_type: 'admin', email: user.email }
      showUserPanel()
      return
    }
    
    // Check if user is doctor or patient
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id, name, specialty, email, work_hours_from, work_hours_to, created_at')
      .eq('email', user.email)
      .maybeSingle()
    
    if (doctor) {
      currentUser = { ...doctor, user_type: 'doctor' }
    } else {
      const { data: patient } = await supabase
        .from('patients')
        .select('id, name, phone, email, created_at')
        .eq('email', user.email)
        .maybeSingle()
      
      if (patient) {
        currentUser = { ...patient, user_type: 'patient' }
      }
    }
    
    if (currentUser) {
      showUserPanel()
    }
  }
}

function showUserPanel() {
  document.getElementById('auth-panel').style.display = 'none'
  document.getElementById('user-panel').style.display = 'block'
  
  const userInfo = document.getElementById('user-info')
  if (currentUser.user_type === 'admin') {
    userInfo.innerHTML = `
      <div class="alert alert-danger mb-3">
        <i class="bi bi-shield-lock"></i> <strong>Администраторски достъп</strong>
      </div>
      <h5>Добре дошли, <span id="admin-greeting-name">${currentUser.name || 'администратор'}</span> (администратор)!</h5>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <hr>
      <h6 class="mt-4 mb-3">Администраторски функции:</h6>
      <button class="btn btn-danger w-100 mb-2" onclick="window.showAdminPanel()">
        <i class="bi bi-gear"></i> Администраторски панел
      </button>
      <p class="text-muted small mt-3">Имате достъп до всички профили, графици и записи.</p>
    `
    
    // If the admin is also a doctor, show the doctor's name in the greeting
    supabase
      .from('doctors')
      .select('name')
      .eq('email', currentUser.email)
      .maybeSingle()
      .then(({ data }) => {
        const nameEl = document.getElementById('admin-greeting-name')
        if (data?.name && nameEl) {
          nameEl.textContent = data.name
        }
      })
  } else if (currentUser.user_type === 'doctor') {
    userInfo.innerHTML = `
      <h5>Добре дошли, д-р ${currentUser.name}!</h5>
      <p><strong>Специалност:</strong> ${currentUser.specialty}</p>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <p><strong>Работни часове:</strong> <span id="user-work-hours">${currentUser.work_hours_from} - ${currentUser.work_hours_to}</span></p>
      <div id="admin-request-status" class="mt-3"></div>
    `
    
    // Listen for doctor profile updates and refresh the display
    eventBus.on(EVENTS.DOCTOR_UPDATED, async (data) => {
      // Reload fresh user data from database
      const { data: updatedDoctor } = await supabase
        .from('doctors')
        .select('id, name, specialty, email, work_hours_from, work_hours_to, created_at')
        .eq('email', currentUser.email)
        .maybeSingle()
      
      if (updatedDoctor) {
        currentUser = { ...updatedDoctor, user_type: 'doctor' }
        const workHoursElement = document.getElementById('user-work-hours')
        if (workHoursElement) {
          workHoursElement.textContent = `${updatedDoctor.work_hours_from} - ${updatedDoctor.work_hours_to}`
        }
      }
    })
    
    loadAdminRequestStatus()
  } else {
    userInfo.innerHTML = `
      <h5>Добре дошли, ${currentUser.name}!</h5>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <p><strong>Телефон:</strong> ${currentUser.phone}</p>
      <p class="text-muted">Изберете лекар от списъка вляво, за да запишете час.</p>
    `
  }
}

function setupEventListeners() {
  // Doctor registration
  const doctorForm = document.getElementById('doctor-reg-form')
  if (doctorForm) {
    doctorForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await registerDoctor()
    })
  }
  
  // Patient registration
  const patientForm = document.getElementById('patient-reg-form')
  if (patientForm) {
    patientForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await registerPatient()
    })
  }
  
  // Login
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
  const email = document.getElementById('doctor-email').value
  const password = document.getElementById('doctor-password').value
  const hoursFrom = document.getElementById('doctor-hours-from').value
  const hoursTo = document.getElementById('doctor-hours-to').value
  const wantsAdmin = document.getElementById('doctor-request-admin').checked
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password
    })
    
    if (authError) throw authError
    
    // Create doctor record
    const { data, error } = await supabase
      .from('doctors')
      .insert([{
        name: name,
        specialty: specialty,
        email: email,
        work_hours_from: hoursFrom,
        work_hours_to: hoursTo
      }])
      .select('id, name, specialty, email, work_hours_from, work_hours_to, created_at')
    
    if (error) throw error
    
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
    window.showLoginForm()
    loadDoctors()
  } catch (error) {
    console.error('Error registering doctor:', error)
    alert('Грешка при регистрация: ' + error.message)
  }
}

async function loadAdminRequestStatus() {
  if (!currentUser || currentUser.user_type !== 'doctor') return
  const container = document.getElementById('admin-request-status')
  if (!container) return

  try {
    const { data, error } = await supabase
      .from('admin_requests')
      .select('status, reviewed_at, requested_at')
      .eq('email', currentUser.email)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      container.innerHTML = ''
      return
    }

    if (data.status === 'pending') {
      container.innerHTML = '<div class="alert alert-warning mb-0">Заявката за админ е изпратена и чака одобрение.</div>'
    } else if (data.status === 'approved') {
      container.innerHTML = '<div class="alert alert-success mb-0">Заявката за админ е одобрена. Излезте и влезте отново.</div>'
    } else if (data.status === 'rejected') {
      container.innerHTML = '<div class="alert alert-danger mb-0">Заявката за админ е отхвърлена.</div>'
    }
  } catch (error) {
    container.innerHTML = '<div class="text-muted small">Неуспешна проверка на статуса за админ.</div>'
  }
}

async function registerPatient() {
  const name = document.getElementById('patient-name').value
  const phone = document.getElementById('patient-phone').value
  const email = document.getElementById('patient-email').value
  const password = document.getElementById('patient-password').value
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password
    })
    
    if (authError) throw authError
    
    // Create patient record
    const { data, error } = await supabase
      .from('patients')
      .insert([{
        name: name,
        phone: phone,
        email: email
      }])
      .select('id, name, phone, email, created_at')
    
    if (error) throw error
    
    await supabase.auth.signOut()

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
    
    await checkUserSession()
  } catch (error) {
    console.error('Error logging in:', error)
    alert('Грешка при вход: ' + error.message)
  }
}

// Global functions for UI navigation
window.showAuthForm = (type) => {
  document.getElementById('user-type-selection').style.display = 'none'
  document.getElementById('doctor-register-form').style.display = type === 'doctor' ? 'block' : 'none'
  document.getElementById('patient-register-form').style.display = type === 'patient' ? 'block' : 'none'
  document.getElementById('login-form').style.display = 'none'
}

window.showLoginForm = () => {
  document.getElementById('user-type-selection').style.display = 'none'
  document.getElementById('doctor-register-form').style.display = 'none'
  document.getElementById('patient-register-form').style.display = 'none'
  document.getElementById('login-form').style.display = 'block'
}

window.showUserTypeSelection = () => {
  document.getElementById('user-type-selection').style.display = 'block'
  document.getElementById('doctor-register-form').style.display = 'none'
  document.getElementById('patient-register-form').style.display = 'none'
  document.getElementById('login-form').style.display = 'none'
}

window.logout = async () => {
  await supabase.auth.signOut()
  currentUser = null
  isAdmin = false
  document.getElementById('auth-panel').style.display = 'block'
  document.getElementById('user-panel').style.display = 'none'
  document.getElementById('booking-panel').style.display = 'none'
  window.showUserTypeSelection()
}

// ===================================================
// ADMIN PANEL FUNCTIONS
// ===================================================

window.showAdminPanel = async () => {
  const container = document.createElement('div')
  container.className = 'container-fluid py-4'
  
  container.innerHTML = `
    <div class="row">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-danger text-white">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-shield-lock"></i> Администраторски панел</h5>
              <button class="btn btn-sm btn-outline-light" onclick="window.location.reload()">
                <i class="bi bi-house"></i> Назад
              </button>
            </div>
          </div>
          <div class="card-body">
            <!-- Tabs for different admin functions -->
            <ul class="nav nav-tabs mb-4" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="doctors-tab" data-bs-toggle="tab" data-bs-target="#doctors-panel" type="button" role="tab">
                  <i class="bi bi-person-badge"></i> Лекари (${(await getDoctorsCount())})
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="patients-tab" data-bs-toggle="tab" data-bs-target="#patients-panel" type="button" role="tab">
                  <i class="bi bi-person"></i> Пациенти (${(await getPatientsCount())})
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="appointments-tab" data-bs-toggle="tab" data-bs-target="#appointments-panel" type="button" role="tab">
                  <i class="bi bi-calendar-event"></i> Записи
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="admin-requests-tab" data-bs-toggle="tab" data-bs-target="#admin-requests-panel" type="button" role="tab">
                  <i class="bi bi-shield-plus"></i> Заявки за админ (${(await getAdminRequestsCount())})
                </button>
              </li>
            </ul>

            <!-- Doctors Panel -->
            <div class="tab-content">
              <div class="tab-pane fade show active" id="doctors-panel" role="tabpanel">
                <h6 class="mb-3">Управление на лекари</h6>
                <div id="doctors-admin-list"></div>
              </div>

              <!-- Patients Panel -->
              <div class="tab-pane fade" id="patients-panel" role="tabpanel">
                <h6 class="mb-3">Управление на пациенти</h6>
                <div id="patients-admin-list"></div>
              </div>

              <!-- Appointments Panel -->
              <div class="tab-pane fade" id="appointments-panel" role="tabpanel">
                <h6 class="mb-3">Всички записи</h6>
                <div id="appointments-admin-list"></div>
              </div>

              <!-- Admin Requests Panel -->
              <div class="tab-pane fade" id="admin-requests-panel" role="tabpanel">
                <h6 class="mb-3">Заявки за администратор</h6>
                <div id="admin-requests-list"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  
  document.getElementById('app').innerHTML = ''
  document.getElementById('app').appendChild(container)
  
  // Load admin data
  await loadAdminDoctors()
  await loadAdminPatients()
  await loadAdminAppointments()
  await loadAdminRequests()
}

async function getDoctorsCount() {
  const { count } = await supabase
    .from('doctors')
    .select('id', { count: 'exact', head: true })
  return count || 0
}

async function getPatientsCount() {
  const { count } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
  return count || 0
}

async function getAdminRequestsCount() {
  const { count } = await supabase
    .from('admin_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  return count || 0
}

async function loadAdminDoctors() {
  const container = document.getElementById('doctors-admin-list')
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('id, name, specialty, email, work_hours_from, work_hours_to, created_at')
      .order('name')
    
    if (error) throw error
    
    let html = '<div class="table-responsive"><table class="table table-striped">'
    html += '<thead><tr><th>Име</th><th>Специалност</th><th>Email</th><th>Работни часове</th><th>Действие</th></tr></thead><tbody>'
    
    if (doctors && doctors.length > 0) {
      doctors.forEach(doc => {
        html += `
          <tr>
            <td>${doc.name}</td>
            <td>${doc.specialty || '-'}</td>
            <td>${doc.email}</td>
            <td>${doc.work_hours_from} - ${doc.work_hours_to}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="window.deleteDoctor('${doc.id}')">
                <i class="bi bi-trash"></i> Изтрий
              </button>
            </td>
          </tr>
        `
      })
    } else {
      html += '<tr><td colspan="5" class="text-center text-muted">Няма регистрирани лекари</td></tr>'
    }
    
    html += '</tbody></table></div>'
    container.innerHTML = html
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Грешка: ${error.message}</div>`
  }
}

async function loadAdminPatients() {
  const container = document.getElementById('patients-admin-list')
  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, name, phone, email, created_at')
      .order('name')
    
    if (error) throw error
    
    let html = '<div class="table-responsive"><table class="table table-striped">'
    html += '<thead><tr><th>Име</th><th>Телефон</th><th>Email</th><th>Регистриран</th><th>Действие</th></tr></thead><tbody>'
    
    if (patients && patients.length > 0) {
      patients.forEach(patient => {
        const date = new Date(patient.created_at).toLocaleDateString('bg-BG')
        html += `
          <tr>
            <td>${patient.name}</td>
            <td>${patient.phone || '-'}</td>
            <td>${patient.email}</td>
            <td>${date}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="window.deletePatient('${patient.id}')">
                <i class="bi bi-trash"></i> Изтрий
              </button>
            </td>
          </tr>
        `
      })
    } else {
      html += '<tr><td colspan="5" class="text-center text-muted">Няма регистрирани пациенти</td></tr>'
    }
    
    html += '</tbody></table></div>'
    container.innerHTML = html
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Грешка: ${error.message}</div>`
  }
}

async function loadAdminAppointments() {
  const container = document.getElementById('appointments-admin-list')
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at, doctors(name), patients(name)')
      .order('appointment_date', { ascending: true })
    
    if (error) throw error
    
    let html = '<div class="table-responsive"><table class="table table-striped">'
    html += '<thead><tr><th>Лекар</th><th>Пациент</th><th>Дата</th><th>Час</th><th>Статус</th><th>Оплаквания</th><th>Действие</th></tr></thead><tbody>'
    
    if (appointments && appointments.length > 0) {
      appointments.forEach(apt => {
        html += `
          <tr>
            <td>${apt.doctors.name}</td>
            <td>${apt.patients.name}</td>
            <td>${apt.appointment_date}</td>
            <td>${apt.appointment_time}</td>
            <td><span class="badge bg-info">${apt.status}</span></td>
            <td><small>${apt.complaints ? apt.complaints.substring(0, 30) + '...' : '-'}</small></td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="window.deleteAppointment('${apt.id}')">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `
      })
    } else {
      html += '<tr><td colspan="7" class="text-center text-muted">Няма записи</td></tr>'
    }
    
    html += '</tbody></table></div>'
    container.innerHTML = html
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Грешка: ${error.message}</div>`
  }
}

async function loadAdminRequests() {
  const container = document.getElementById('admin-requests-list')
  try {
    const { data: requests, error } = await supabase
      .from('admin_requests')
      .select('id, doctor_id, email, name, specialty, status, requested_at')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (error) throw error

    let html = '<div class="table-responsive"><table class="table table-striped">'
    html += '<thead><tr><th>Име</th><th>Специалност</th><th>Email</th><th>Заявена на</th><th>Действие</th></tr></thead><tbody>'

    if (requests && requests.length > 0) {
      requests.forEach(req => {
        const date = new Date(req.requested_at).toLocaleString('bg-BG')
        html += `
          <tr>
            <td>${req.name}</td>
            <td>${req.specialty || '-'}</td>
            <td>${req.email}</td>
            <td>${date}</td>
            <td>
              <button class="btn btn-sm btn-success me-2" onclick="window.approveAdminRequest('${req.id}')">
                <i class="bi bi-check-lg"></i> Одобри
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="window.rejectAdminRequest('${req.id}')">
                <i class="bi bi-x-lg"></i> Откажи
              </button>
            </td>
          </tr>
        `
      })
    } else {
      html += '<tr><td colspan="5" class="text-center text-muted">Няма чакащи заявки</td></tr>'
    }

    html += '</tbody></table></div>'
    container.innerHTML = html
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Грешка: ${error.message}</div>`
  }
}

window.approveAdminRequest = async (requestId) => {
  if (!confirm('Да одобря ли заявката за админ?')) return
  try {
    const { data: req, error } = await supabase
      .from('admin_requests')
      .select('id, email, name, status')
      .eq('id', requestId)
      .maybeSingle()

    if (error) throw error
    if (!req) throw new Error('Заявката не е намерена.')
    if (req.status !== 'pending') {
      alert('Заявката вече е обработена.')
      return
    }

    const { error: insertError } = await supabase
      .from('admins')
      .insert([{ email: req.email, name: req.name, is_active: true }])

    if (insertError && !String(insertError.message || '').toLowerCase().includes('duplicate')) {
      throw insertError
    }

    const { error: updateError } = await supabase
      .from('admin_requests')
      .update({
        status: 'approved',
        reviewed_by: currentUser?.id || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) throw updateError

    alert('Заявката е одобрена.')
    window.showAdminPanel()
  } catch (error) {
    alert('Грешка при одобрение: ' + error.message)
  }
}

window.rejectAdminRequest = async (requestId) => {
  if (!confirm('Да откажа ли заявката за админ?')) return
  try {
    const { error } = await supabase
      .from('admin_requests')
      .update({
        status: 'rejected',
        reviewed_by: currentUser?.id || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) throw error
    alert('Заявката е отхвърлена.')
    window.showAdminPanel()
  } catch (error) {
    alert('Грешка при отказ: ' + error.message)
  }
}

window.deleteDoctor = async (doctorId) => {
  if (!confirm('Сигурни ли сте? Това действие е необратимо.')) return
  
  try {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', doctorId)
    
    if (error) throw error
    alert('Лекарят е изтрит успешно!')
    window.showAdminPanel()
  } catch (error) {
    alert('Грешка при изтриване: ' + error.message)
  }
}

window.deletePatient = async (patientId) => {
  if (!confirm('Сигурни ли сте? Това действие е необратимо.')) return
  
  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
    
    if (error) throw error
    alert('Пациентът е изтрит успешно!')
    window.showAdminPanel()
  } catch (error) {
    alert('Грешка при изтриване: ' + error.message)
  }
}

window.deleteAppointment = async (appointmentId) => {
  if (!confirm('Сигурни ли сте? Това действие е необратимо.')) return
  
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId)
    
    if (error) throw error
    alert('Записът е изтрит успешно!')
    window.showAdminPanel()
  } catch (error) {
    alert('Грешка при изтриване: ' + error.message)
  }
}
