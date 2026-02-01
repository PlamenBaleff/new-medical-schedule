import { supabase } from '../services/supabase.js'
import { eventBus, EVENTS } from '../services/eventBus.js'

let selectedDoctor = null
let currentUser = null
let isAdmin = false
const PENDING_PROFILE_KEY = 'pending_profile_v1'

function savePendingProfile(profile) {
  try {
    localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.warn('Unable to save pending profile:', error)
  }
}

function loadPendingProfile() {
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Unable to read pending profile:', error)
    return null
  }
}

function clearPendingProfile(email) {
  try {
    const pending = loadPendingProfile()
    if (!pending || !email || pending.email === email) {
      localStorage.removeItem(PENDING_PROFILE_KEY)
    }
  } catch (error) {
    console.warn('Unable to clear pending profile:', error)
  }
}

async function ensureProfileForAuthUser(user) {
  if (!user?.email) return
  const email = user.email
  const pending = loadPendingProfile()

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  if (doctor) {
    if (pending?.email === email) clearPendingProfile(email)
    return
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  if (patient) {
    if (pending?.email === email) clearPendingProfile(email)
    return
  }

  if (!pending || pending.email !== email) return

  try {
    if (pending.user_type === 'doctor') {
      await supabase
        .from('doctors')
        .insert([pending.profile])
        .select('id')
    } else if (pending.user_type === 'patient') {
      await supabase
        .from('patients')
        .insert([pending.profile])
        .select('id')
    }
    clearPendingProfile(email)
  } catch (error) {
    console.warn('Pending profile migration failed:', error.message)
  }
}

export default function HomePage() {
  const container = document.createElement('div')
  container.className = 'container-fluid py-4'
  
  container.innerHTML = `
    <div class="row g-4">
      <!-- Left Column - Doctors List -->
      <div class="col-lg-4">
        <div class="card shadow-sm mb-3">
          <div class="card-header" style="background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%); color: white;">
            <h5 class="mb-0"><i class="fas fa-user-md" style="font-size: 20px; margin-right: 8px;"></i> Списък с лекари</h5>
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
        <!-- Calendar Section for selected doctor -->
        <div id="calendar-section" class="card shadow-sm" style="display:none;">
          <div class="card-header" style="background: linear-gradient(135deg, #4DD0E1 0%, #26C6DA 100%); color: white;">
            <h5 class="mb-0"><i class="fas fa-calendar-check" style="font-size: 20px; margin-right: 8px;"></i> График на <span id="doctor-name-header"></span></h5>
          </div>
          <div class="card-body">
            <div id="calendar-container"></div>
          </div>
        </div>
      </div>

      <!-- Right Column - Login/Registration Panel + Calendar (sticky) -->
      <div class="col-lg-8">
        <div id="auth-panel-wrapper">
        <!-- Auth Panel (shown when not logged in) -->
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

        <!-- User Panel (shown when logged in) -->
        <div id="user-panel" class="card shadow-sm" style="display: none;">
          <div class="card-header" style="background: linear-gradient(135deg, #455A64 0%, #37474F 100%); color: white;">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-user-check" style="font-size: 20px; margin-right: 8px;"></i> Профил</h5>
              <button class="btn btn-sm btn-outline-light" onclick="window.logout()">
                <i class="fas fa-sign-out-alt" style="margin-right: 6px;"></i> Изход
              </button>
            </div>
          </div>
          <div class="card-body">
            <div id="user-info"></div>
          </div>
        </div>

        <!-- Appointment Booking Panel (for patients) -->
        <div id="booking-panel" class="card shadow-sm mt-3" style="display: none;">
          <div class="card-header" style="background: linear-gradient(135deg, #FFB74D 0%, #FFA726 100%); color: white;">
            <h5 class="mb-0"><i class="fas fa-calendar-plus" style="font-size: 20px; margin-right: 8px;"></i> Запиши час</h5>
          </div>
          <div class="card-body">
            <div id="booking-form-container"></div>
          </div>
        </div>
      </div>
        <!-- Sticky Calendar Panel -->
        <div id="month-calendar-home" style="position:sticky;top:24px;z-index:10;"></div>
        <div id="selected-day-schedule-panel" class="card shadow-sm mt-3" style="display:none;"></div>
      </div>
    </div>
  `
  
  // Initialize the page
  setTimeout(() => {
    // Вмъкни календара под auth/user/booking панелите
    import('../components/MonthCalendar.js').then(({ default: MonthCalendar }) => {
      const calendar = MonthCalendar({
        onDateSelect: (date) => {
          window.selectedDayFromCalendar = date;
          renderSelectedDaySchedule();
        }
      })
      document.getElementById('month-calendar-home').appendChild(calendar)
    })
    window.selectedDayFromCalendar = null;
    window.selectedDoctorForDay = null;
    window.renderSelectedDaySchedule = async function() {
      const panel = document.getElementById('selected-day-schedule-panel');
      if (!panel) return;
      const date = window.selectedDayFromCalendar;
      const doctor = window.selectedDoctorForDay;
      if (!date) {
        panel.style.display = 'none';
        return;
      }
      panel.style.display = 'block';
      panel.innerHTML = `<div class="card-header bg-info text-white"><i class="fas fa-calendar-day"></i> График за ${date}</div><div class="card-body"><div id="selected-day-slots"></div></div>`;
      const slotsDiv = document.getElementById('selected-day-slots');
      if (!doctor) {
        slotsDiv.innerHTML = '<div class="text-muted">Изберете лекар от списъка вляво.</div>';
        return;
      }
      slotsDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div></div>';
      // Зареждане на часовете за избрания лекар и ден
      try {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', doctor.id)
          .eq('appointment_date', date);
        const bookedTimes = (appointments || []).map(a => a.appointment_time.substring(0,5));
        const workFrom = doctor.work_hours_from || '08:00';
        const workTo = doctor.work_hours_to || '17:00';
        const startHour = parseInt(workFrom.split(':')[0]);
        const endHour = parseInt(workTo.split(':')[0]);
        let html = '';
        const user = currentUser;
        for (let h = startHour; h < endHour; h++) {
          const t = `${String(h).padStart(2,'0')}:00`;
          const isBooked = bookedTimes.includes(t);
          if (isBooked) {
            html += `<div class="mb-2"><button class="btn btn-danger btn-lg w-100" disabled style="font-size:1.1rem;"><i class="fas fa-times-circle"></i> ${t} - Запазен</button></div>`;
          } else if (user && user.user_type === 'patient') {
            html += `<div class="mb-2"><button class="btn btn-success btn-lg w-100 book-slot-btn" data-time="${t}" style="font-size:1.1rem;"><i class="fas fa-check-circle"></i> ${t} - Свободен</button></div>`;
          } else {
            html += `<div class="mb-2"><button class="btn btn-success btn-lg w-100" disabled style="font-size:1.1rem;"><i class="fas fa-check-circle"></i> ${t} - Свободен</button></div>`;
          }
        }
        slotsDiv.innerHTML = html;
        // Добавям click handler-и за записване на час
        if (user && user.user_type === 'patient') {
          slotsDiv.querySelectorAll('.book-slot-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const time = btn.dataset.time;
              // Покажи форма за записване
              slotsDiv.innerHTML = `<form id="booking-form-selected-day"><div class="mb-3"><label class="form-label">Оплаквания / Причина за посещението</label><textarea class="form-control" id="booking-complaints-selected-day" rows="3" required placeholder="Опишете накратко оплакванията си..."></textarea></div><button type="submit" class="btn btn-warning">Потвърди запис за ${time}</button> <button type="button" class="btn btn-secondary ms-2" id="cancel-booking-selected-day">Назад</button></form>`;
              document.getElementById('cancel-booking-selected-day').onclick = () => renderSelectedDaySchedule();
              document.getElementById('booking-form-selected-day').onsubmit = async (e) => {
                e.preventDefault();
                const complaints = document.getElementById('booking-complaints-selected-day').value;
                try {
                  const { error } = await supabase
                    .from('appointments')
                    .insert([{
                      doctor_id: doctor.id,
                      patient_id: user.id,
                      appointment_date: date,
                      appointment_time: time,
                      complaints: complaints,
                      status: 'scheduled'
                    }]);
                  if (error) throw error;
                  slotsDiv.innerHTML = '<div class="alert alert-success">Успешно записан час!</div>';
                  setTimeout(renderSelectedDaySchedule, 1200);
                } catch (err) {
                  slotsDiv.innerHTML = '<div class="alert alert-danger">Грешка при записване на час!</div>';
                  setTimeout(renderSelectedDaySchedule, 1200);
                }
              };
            });
          });
        }
      } catch (e) {
        slotsDiv.innerHTML = '<div class="text-danger">Грешка при зареждане на графика.</div>';
      }
    }
    // Синхронизирай избора на доктор от списъка
    window.setSelectedDoctorForDay = function(doctor) {
      window.selectedDoctorForDay = doctor;
      renderSelectedDaySchedule();
    }
    initializePage();
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
        <small><i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i> Supabase връзка временно недостъпна. Показват се демо данни.</small>
      </div>
    `
    renderDoctorsList(demoDoctors, doctorsList)
  }
}

function renderDoctorsList(doctors, container) {
  const doctorsHTML = doctors.map(doctor => `
    <a href="#" class="list-group-item list-group-item-action doctor-item" data-doctor-id="${doctor.id}">
      <div class="d-flex w-100 justify-content-between">
        <h6 class="mb-1"><i class="fas fa-user-md" style="margin-right: 8px;"></i> ${doctor.name}</h6>
        <small class="text-success"><i class="fas fa-circle" style="margin-right: 4px;"></i></small>
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
  window.setSelectedDoctorForDay && window.setSelectedDoctorForDay(doctor);
  
  // Highlight selected doctor
  document.querySelectorAll('.doctor-item').forEach(item => {
    item.classList.remove('active')
  })
  const selectedItem = document.querySelector(`[data-doctor-id="${doctorId}"]`)
  if (selectedItem) {
    selectedItem.classList.add('active')
  }
  
  // Show calendar section
  const calendarSection = document.getElementById('calendar-section')
  const doctorNameHeader = document.getElementById('doctor-name-header')
  if (calendarSection && doctorNameHeader) {
    doctorNameHeader.textContent = doctor.name
    calendarSection.style.display = 'block'
  }
  
  // Load calendar
  await loadDoctorCalendar(doctor)
  
  // If patient is logged in, show booking panel
  if (currentUser && currentUser.user_type === 'patient') {
    showBookingPanel(doctor)
  }
}

let appointmentMap = {}

async function loadDoctorCalendar(doctor) {
  const calendarContainer = document.getElementById('calendar-container')
  if (!calendarContainer) {
    console.error('Calendar container not found!')
    return
  }
  
  // Изчистваме контейнера преди да започнем
  calendarContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div><p class="mt-2">Зареждане...</p></div>'
  
  const today = new Date()
  const weekDays = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    weekDays.push(date)
  }
  
  try {
    // КРИТИЧНО: ИЗЧИСТВАМЕ ЦЕЛИЯ appointmentMap преди да заредим нов лекар
    appointmentMap = {}
    
    // Заредяме appointments за този лекар
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctor.id)
    
    if (error) {
      console.error('Error loading appointments:', error)
      calendarContainer.innerHTML = '<div class="alert alert-danger">Грешка при зареждане на записите</div>'
      return
    }
    
    // Добавяме appointments за ТОЗИ ЛЕКАР
    if (appointments && appointments.length > 0) {
      appointments.forEach(apt => {
        // КРИТИЧНО: Нормализираме времето (премахваме секундите)
        const timeWithoutSeconds = apt.appointment_time.substring(0, 5) // "16:00:00" -> "16:00"
        const key = `${apt.appointment_date}_${timeWithoutSeconds}`
        appointmentMap[key] = apt
      })
    }
    
    // Генериране на календара
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
      
      const workHoursFrom = doctor.work_hours_from || '08:00'
      const workHoursTo = doctor.work_hours_to || '17:00'
      const startHour = parseInt(workHoursFrom.split(':')[0])
      const endHour = parseInt(workHoursTo.split(':')[0])
      
      for (let hour = startHour; hour < endHour; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`
        const key = `${dateStr}_${timeStr}`
        const isBooked = appointmentMap.hasOwnProperty(key)
        
        if (isBooked) {
          // ЗАПАЗЕН ЧАС - ЧЕРВЕН
          calendarHTML += `
            <button class="btn btn-sm w-100 mb-1 time-slot" 
                    data-date="${dateStr}" 
                    data-time="${timeStr}"
                    style="background-color: #dc3545; border-color: #dc3545; color: white;"
                    disabled>
              <i class="fas fa-times-circle" style="margin-right: 6px;"></i> ${timeStr} - Запазен
            </button>
          `
        } else {
          // СВОБОДЕН ЧАС - ЗЕЛЕН
          calendarHTML += `
            <button class="btn btn-success btn-sm w-100 mb-1 time-slot" 
                    data-date="${dateStr}" 
                    data-time="${timeStr}">
              <i class="fas fa-check-circle" style="margin-right: 6px;"></i> ${timeStr} - Свободен
            </button>
          `
        }
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
  } catch (error) {
    console.error('Fatal error in loadDoctorCalendar:', error)
    if (calendarContainer) {
      calendarContainer.innerHTML = '<div class="alert alert-danger">Грешка при зареждане на календара</div>'
    }
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
    if (!currentUser || !currentUser.id) {
      alert('Моля, влезте като пациент, за да запишете час.')
      return
    }

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
      .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at')
    
    if (error) throw error
    
    // Актуализирам appointmentMap с новия запис
    const newAppointment = data[0]
    const key = `${date}_${time}`
    appointmentMap[key] = newAppointment
    
    // Актуализирам только този час в UI без презареждане на целия календар
    const slotButton = document.querySelector(`.time-slot[data-date="${date}"][data-time="${time}"]`)
    if (slotButton) {
      slotButton.classList.remove('btn-success')
      slotButton.classList.add('btn-danger')
      slotButton.setAttribute('disabled', 'disabled')
      slotButton.innerHTML = `<i class="fas fa-times-circle" style="margin-right: 6px;"></i> ${time} - Запазен`
      slotButton.removeEventListener('click', null) // Премахвам click handler
    }
    
    alert('Часът е записан успешно!')
    document.getElementById('booking-form-container').innerHTML = '<div class="alert alert-success">Успешно записан час!</div>'
  } catch (error) {
    console.error('Error creating appointment:', error)
    alert('Грешка при записване на час: ' + error.message)
  }
}

async function checkUserSession() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await ensureProfileForAuthUser(user)
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
      .select('*')
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
        <i class="fas fa-shield-alt"></i> <strong>Администраторски достъп</strong>
      </div>
      <h5>Добре дошли, <span id="admin-greeting-name">${currentUser.name || 'администратор'}</span> (администратор)!</h5>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <hr>
      <h6 class="mt-4 mb-3">Администраторски функции:</h6>
      <button class="btn btn-danger w-100 mb-2" onclick="window.showAdminPanel()">
        <i class="fas fa-tools"></i> Администраторски панел
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
      <p><strong>Телефон:</strong> ${currentUser.phone || 'Не е посочен'}</p>
      <p><strong>Адрес:</strong> ${currentUser.address || 'Не е посочен'}</p>
      <p><strong>Работни часове:</strong> <span id="user-work-hours">${currentUser.work_hours_from} - ${currentUser.work_hours_to}</span></p>
      <div id="admin-request-status" class="mt-3"></div>
    `
    
    // Listen for doctor profile updates and refresh the display
    eventBus.on(EVENTS.DOCTOR_UPDATED, async (data) => {
      // Reload fresh user data from database
      const { data: updatedDoctor } = await supabase
        .from('doctors')
        .select('*')
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
    // Create auth user
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
    
    // Create doctor record
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
    // Create auth user
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
    
    // Create patient record
    const { data, error } = await supabase
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
    
    // If a doctor is already selected, reload the calendar to show correct availability
    if (selectedDoctor && currentUser && currentUser.user_type === 'patient') {
      await loadDoctorCalendar(selectedDoctor)
    }
    
    // Refresh the selected day schedule panel if it's open
    if (window.renderSelectedDaySchedule) {
      window.renderSelectedDaySchedule()
    }
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
  
  // Clear calendar and reset it
  const calendarContainer = document.getElementById('calendar-container')
  if (calendarContainer) {
    calendarContainer.innerHTML = ''
  }
  
  const calendarSection = document.getElementById('calendar-section')
  if (calendarSection) {
    calendarSection.style.display = 'none'
  }
  
  // Clear selected day schedule panel
  const selectedDayPanel = document.getElementById('selected-day-schedule-panel')
  if (selectedDayPanel) {
    selectedDayPanel.style.display = 'none'
    selectedDayPanel.innerHTML = ''
  }
  
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
              <h5 class="mb-0"><i class="fas fa-shield-alt" style="font-size: 20px; margin-right: 8px;"></i> Администраторски панел</h5>
              <button class="btn btn-sm btn-outline-light" onclick="window.location.reload()">
                <i class="fas fa-home" style="margin-right: 6px;"></i> Назад
              </button>
            </div>
          </div>
          <div class="card-body">
            <!-- Tabs for different admin functions -->
            <ul class="nav nav-tabs mb-4" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="doctors-tab" data-bs-toggle="tab" data-bs-target="#doctors-panel" type="button" role="tab">
                  <i class="fas fa-user-md" style="margin-right: 6px;"></i> Лекари (${(await getDoctorsCount())})
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="patients-tab" data-bs-toggle="tab" data-bs-target="#patients-panel" type="button" role="tab">
                  <i class="fas fa-user" style="margin-right: 6px;"></i> Пациенти (${(await getPatientsCount())})
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="appointments-tab" data-bs-toggle="tab" data-bs-target="#appointments-panel" type="button" role="tab">
                  <i class="fas fa-calendar-check" style="margin-right: 6px;"></i> Записи
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="admin-requests-tab" data-bs-toggle="tab" data-bs-target="#admin-requests-panel" type="button" role="tab">
                  <i class="fas fa-user-shield" style="margin-right: 6px;"></i> Заявки за админ (${(await getAdminRequestsCount())})
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
      .select('*')
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
                <i class="fas fa-trash" style="margin-right: 6px;"></i> Изтрий
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
                <i class="fas fa-trash" style="margin-right: 6px;"></i> Изтрий
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
                <i class="fas fa-trash"></i>
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
                <i class="fas fa-check" style="margin-right: 6px;"></i> Одобри
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="window.rejectAdminRequest('${req.id}')">
                <i class="fas fa-times" style="margin-right: 6px;"></i> Откажи
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
