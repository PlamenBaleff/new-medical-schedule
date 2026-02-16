import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '../services/supabase.js'
import { eventBus, EVENTS } from '../services/eventBus.js'
import { renderDoctorAvatarImg } from '../utils/doctorAvatar.js'
import { ensureProfileForAuthUser } from '../services/pendingProfile.js'
import { navigateTo } from '../services/router.js'

let selectedDoctor = null
let currentUser = null
let isAdmin = false

// Patient name cache to avoid repeated queries
const patientNameCache = {}

// Helper to fetch patient name by ID
const getPatientName = async (patientId) => {
  if (!patientId) {
    console.warn('getPatientName: no patientId provided')
    return 'Неизвестен'
  }
  
  if (patientNameCache[patientId]) {
    console.log('getPatientName: cache hit for', patientId, '=', patientNameCache[patientId])
    return patientNameCache[patientId]
  }
  
  try {
    console.log('getPatientName: fetching from DB for', patientId)
    const { data, error } = await supabase
      .from('patients')
      .select('id, name')
      .eq('id', patientId)
      .single()
    
    if (error) {
      console.error('getPatientName error:', error.message)
      patientNameCache[patientId] = 'Неизвестен'
      return 'Неизвестен'
    }
    
    if (data?.name) {
      console.log('getPatientName: got name from DB:', data.name)
      patientNameCache[patientId] = data.name
      return data.name
    }
  } catch (error) {
    console.error('getPatientName exception:', error)
  }
  
  patientNameCache[patientId] = 'Неизвестен'
  return 'Неизвестен'
}

const canViewAppointmentDetails = (viewer, doctorId) => {
  if (!viewer) return false
  if (viewer.user_type === 'admin') return true
  if (viewer.user_type === 'doctor' && viewer.id === doctorId) return true
  return false
}

// Function to show patient complaints in a modal
const showComplaintsModal = (patientName, complaints, appointmentTime) => {
  const existingModal = document.getElementById('complaints-modal-home')
  if (existingModal) existingModal.remove()

  const modalDiv = document.createElement('div')
  modalDiv.id = 'complaints-modal-home'
  modalDiv.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h5 style="margin: 0;"><i class="fas fa-clipboard-list" style="margin-right: 8px; color: #FF9800;"></i> Оплаквания на пациента</h5>
          <button onclick="document.getElementById('complaints-modal-home').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999;">&times;</button>
        </div>
        <hr style="margin: 12px 0; border: none; border-top: 1px solid #eee;">
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
            <strong style="color: #333;">Пациент:</strong> ${patientName}
          </p>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
            <strong style="color: #333;">Час:</strong> ${appointmentTime.substring(0, 5)}
          </p>
        </div>
        <div style="background: #F5F5F5; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${complaints}</p>
        </div>
        <button onclick="document.getElementById('complaints-modal-home').remove()" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
          Затвори
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modalDiv)
}

export default function HomePage() {
  const container = document.createElement('div')
  container.className = 'container-fluid py-4'
  
  container.innerHTML = `
    <!-- User Panel (shown when logged in) -->
    <div id="user-panel" class="card shadow-sm mb-3" style="display: none;">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0 d-flex align-items-center gap-2">
            <span id="user-panel-profile-icon">
              <i class="fas fa-user-check" style="font-size: 20px;"></i>
            </span>
            <span>Профил</span>
          </h5>
          <button class="btn btn-sm btn-outline-dark" id="user-panel-logout-btn" onclick="window.logout()">
            <i class="fas fa-sign-out-alt" style="margin-right: 6px;"></i> Изход
          </button>
        </div>
      </div>
      <div class="card-body">
        <div id="user-info"></div>
      </div>
    </div>

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

        <!-- Complaints Panel -->
        <div id="complaints-panel" class="card shadow-sm" style="display: none;">
          <div class="card-header" style="background: linear-gradient(135deg, #FFB74D 0%, #FFA726 100%); color: white;">
            <h5 class="mb-0"><i class="fas fa-clipboard-list" style="font-size: 20px; margin-right: 8px;"></i> Оплаквания на пациента</h5>
          </div>
          <div class="card-body">
            <div id="complaints-content">
              <small class="text-muted">Изберете час, за да видите оплакванията</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Calendar + User Panel -->
      <div class="col-lg-8">
        <div id="month-calendar-home" class="mb-3"></div>
        <div id="selected-day-schedule-panel" class="card shadow-sm mt-3" style="display:none;"></div>

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
      if (!date || !doctor) {
        panel.style.display = 'none';
        return;
      }
      const complaintPanel = container.querySelector('#complaints-panel')
      if (complaintPanel && (!currentUser || currentUser.user_type !== 'admin')) {
        complaintPanel.style.display = 'none'
      }
      panel.style.display = 'block';
      panel.innerHTML = `<div class="card-header bg-info text-white"><i class="fas fa-calendar-day"></i> График за ${date}</div><div class="card-body"><div id="selected-day-slots"></div></div>`;
      const slotsDiv = document.getElementById('selected-day-slots');
      slotsDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div></div>';
      // Зареждане на часовете за избрания лекар и ден
      try {
        const canViewDetails = canViewAppointmentDetails(currentUser, doctor.id)
        let appointments = []
        if (canViewDetails) {
          const { data } = await supabase
            .from('appointments')
            .select('id, appointment_time, complaints, patient_id')
            .eq('doctor_id', doctor.id)
            .eq('appointment_date', date)
          appointments = data || []
          
          // Pre-fetch all patient names for this day's appointments
          const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))]
          for (const pid of patientIds) {
            try {
              await getPatientName(pid)
            } catch (error) {
              console.warn('Failed to pre-fetch patient name for', pid, error)
            }
          }
        } else {
          const booked = await getBookedSlotsForDoctor(doctor.id, date, date)
          appointments = (booked || []).map((row) => ({
            id: null,
            appointment_time: row.appointment_time
          }))
        }
        
        const appointmentMap = {};
        if (appointments) {
          appointments.forEach(a => {
            appointmentMap[a.appointment_time.substring(0, 5)] = a;
          });
        }
        
        const workFrom = doctor.work_hours_from || '08:00';
        const workTo = doctor.work_hours_to || '17:00';
        const startHour = parseInt(workFrom.split(':')[0]);
        const endHour = parseInt(workTo.split(':')[0]);
        let html = '';
        const user = currentUser;
        for (let h = startHour; h < endHour; h++) {
          const t = `${String(h).padStart(2,'0')}:00`;
          const appointment = appointmentMap[t];
          
          if (appointment) {
            if (canViewDetails && user?.user_type === 'doctor') {
              const patientName = patientNameCache[appointment.patient_id] || 'Неизвестен'
              const shortComplaints = appointment.complaints?.substring(0, 20) + (appointment.complaints?.length > 20 ? '...' : '') || 'Без описание'
              const appointmentId = appointment.id
              // Doctor (own schedule) - show patient info and complaints button
              html += `<div class="mb-2"><button class="btn btn-danger btn-lg w-100 show-complaints-btn" data-appointment-id="${appointmentId}" style="font-size:1rem; text-align: left; cursor: pointer;"><i class="fas fa-user-check"></i> ${t} - ${patientName}<br/><small style="margin-left: 22px; font-style: italic;">${shortComplaints}</small></button></div>`;
            } else if (canViewDetails && user?.user_type === 'admin') {
              const patientName = patientNameCache[appointment.patient_id] || 'Неизвестен'
              const shortComplaints = appointment.complaints?.substring(0, 20) + (appointment.complaints?.length > 20 ? '...' : '') || 'Без описание'
              const appointmentId = appointment.id
              // Admin - show patient info and make clickable to show complaints in side panel
              html += `<div class="mb-2"><button class="btn btn-danger btn-lg w-100 show-complaints-side-btn" data-appointment-id="${appointmentId}" data-patient-name="${patientName}" data-complaints="${appointment.complaints || ''}" data-time="${t}" style="font-size:1rem; text-align: left; cursor: pointer;"><i class="fas fa-user-check"></i> ${t} - ${patientName}<br/><small style="margin-left: 22px; font-style: italic;">${shortComplaints}</small></button></div>`;
            } else {
              html += `<div class="mb-2"><button class="btn btn-danger btn-lg w-100" disabled style="font-size:1rem; text-align: left;"><i class="fas fa-user-check"></i> ${t} - Запазен</button></div>`;
            }
          } else if (user && user.user_type === 'patient') {
            html += `<div class="mb-2"><button class="btn btn-success btn-lg w-100 book-slot-btn" data-time="${t}" style="font-size:1.1rem;"><i class="fas fa-check-circle"></i> ${t} - Свободен</button></div>`;
          } else {
            html += `<div class="mb-2"><button class="btn btn-success btn-lg w-100" disabled style="font-size:1.1rem;"><i class="fas fa-check-circle"></i> ${t} - Свободен</button></div>`;
          }
        }
        slotsDiv.innerHTML = html;
        
        if (canViewDetails && user?.user_type === 'doctor') {
          // Add event listeners for complaint buttons (doctor view)
          slotsDiv.querySelectorAll('.show-complaints-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const appointmentId = btn.dataset.appointmentId;
              const { data: appt } = await supabase
                .from('appointments')
                .select('id, appointment_time, complaints, patient_id')
                .eq('id', appointmentId)
                .single();
              
              if (appt) {
                const patientName = await getPatientName(appt.patient_id);
                showComplaintsModal(
                  patientName,
                  appt.complaints || 'Без описание',
                  appt.appointment_time
                );
              }
            });
          });
        }

        if (canViewDetails && user?.user_type === 'admin') {
          // Add event listeners for complaint buttons (admin view - show in side panel)
          slotsDiv.querySelectorAll('.show-complaints-side-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const patientName = btn.dataset.patientName;
              const complaints = btn.dataset.complaints;
              const time = btn.dataset.time;
              
              const complaintPanel = container.querySelector('#complaints-panel');
              const complaintsContent = container.querySelector('#complaints-content');
              
              if (complaintPanel && complaintsContent) {
                complaintPanel.style.display = 'block';
                complaintsContent.innerHTML = `
                  <div style="margin-bottom: 12px;">
                    <p style="margin: 0 0 8px 0; color: #666;">
                      <strong style="color: #333;">Пациент:</strong> ${patientName}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #666;">
                      <strong style="color: #333;">Час:</strong> ${time}
                    </p>
                  </div>
                  <hr style="margin: 12px 0; border: none; border-top: 1px solid #eee;">
                  <div style="background: #F5F5F5; padding: 12px; border-radius: 8px;">
                    <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; font-size: 0.95rem;">${complaints}</p>
                  </div>
                `;
              }
            });
          });
        }
        
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
  
  // Listen for doctor updates and reload doctors list
  eventBus.on(EVENTS.DOCTOR_UPDATED, () => {
    loadDoctors()
  })
}

async function loadDoctors() {
  const doctorsList = document.getElementById('doctors-list')
  
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('id, name, specialty, email, work_hours_from, work_hours_to, created_at, avatar_path, avatar_updated_at')
      .order('name')
    
    if (error) {
      console.warn('Supabase error (RLS policy issue):', error.message)
      console.log('Doctors data despite error:', doctors)
      // Even if there's an error, doctors might still load with public access
      // So we don't throw, we continue
      if (!doctors || doctors.length === 0) {
        throw error
      }
    }
    
    if (doctors && doctors.length > 0) {
      console.log('Successfully loaded doctors:', doctors.map(d => d.name))
      renderDoctorsList(doctors, doctorsList)
      return // Successfully loaded, no need for demo data
    } else {
      doctorsList.innerHTML = '<div class="p-3 text-center text-muted">Няма регистрирани лекари. Регистрирайте се като лекар, за да се появите в списъка.</div>'
    }
  } catch (error) {
    console.error('Error loading doctors from database:', error.message)
    console.error('Full error object:', error)
    
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
        <h6 class="mb-1 d-flex align-items-center gap-2">
          ${renderDoctorAvatarImg(doctor, 28) || '<i class="fas fa-user-doctor" style="margin-right: 2px;"></i>'}
          <span>${doctor.name}</span>
        </h6>
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
  
  // If patient is logged in, show booking panel
  if (currentUser && currentUser.user_type === 'patient') {
    showBookingPanel(doctor)
  }
}

let appointmentMap = {}

async function getBookedSlotsForDoctor(doctorId, startDate, endDate) {
  // Prefer a dedicated RPC that returns only safe columns.
  // Fallback to querying appointments (legacy behavior) if RPC isn't deployed yet.
  try {
    const { data, error } = await supabase.rpc('get_booked_slots', {
      p_doctor_id: doctorId,
      p_start: startDate,
      p_end: endDate
    })
    if (error) throw error
    return (data || []).map((row) => ({
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time
    }))
  } catch (error) {
    const { data, error: fallbackError } = await supabase
      .from('appointments')
      .select('appointment_date, appointment_time')
      .eq('doctor_id', doctorId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)

    if (fallbackError) throw fallbackError
    return data || []
  }
}

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

    const startDate = weekDays[0].toISOString().split('T')[0]
    const endDate = weekDays[weekDays.length - 1].toISOString().split('T')[0]
    const appointments = await getBookedSlotsForDoctor(doctor.id, startDate, endDate)

    if (!appointments) {
      console.error('Error loading appointments: empty result')
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
  
  const avatar = renderDoctorAvatarImg(doctor, 28)

  bookingFormContainer.innerHTML = `
    <h6 class="d-flex align-items-center gap-2">${avatar || ''}<span>Запиши час при ${doctor.name}</span></h6>
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
  } else {
    // Important: clear any previously resolved profile to avoid showing private details
    // when there is no active Supabase auth session.
    currentUser = null
    isAdmin = false
    const userPanel = document.getElementById('user-panel')
    if (userPanel) userPanel.style.display = 'none'
  }
}

function showUserPanel() {
  document.getElementById('user-panel').style.display = 'block'

  updateUserPanelHeaderIcon()
  
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
        updateUserPanelHeaderIcon()
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

async function updateUserPanelHeaderIcon() {
  const iconHost = document.getElementById('user-panel-profile-icon')
  if (!iconHost) return

  const defaultIcon = '<i class="fas fa-user-check" style="font-size: 20px;"></i>'

  try {
    if (!currentUser) {
      iconHost.innerHTML = defaultIcon
      return
    }

    if (currentUser.user_type === 'doctor') {
      iconHost.innerHTML = renderDoctorAvatarImg(currentUser, 24) || defaultIcon
      return
    }

    // If admin has a doctor profile (same email), allow showing that avatar.
    if (currentUser.user_type === 'admin' && currentUser.email) {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('avatar_path, avatar_updated_at, name')
        .eq('email', currentUser.email)
        .maybeSingle()

      iconHost.innerHTML = renderDoctorAvatarImg(doctor, 24) || defaultIcon
      return
    }

    iconHost.innerHTML = defaultIcon
  } catch (error) {
    console.warn('Unable to update user panel header icon:', error?.message || error)
    iconHost.innerHTML = defaultIcon
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

window.logout = async () => {
  await supabase.auth.signOut()
  currentUser = null
  isAdmin = false
  
  // Clear selected day schedule panel
  const selectedDayPanel = document.getElementById('selected-day-schedule-panel')
  if (selectedDayPanel) {
    selectedDayPanel.style.display = 'none'
    selectedDayPanel.innerHTML = ''
  }

  const userPanel = document.getElementById('user-panel')
  if (userPanel) userPanel.style.display = 'none'
  const bookingPanel = document.getElementById('booking-panel')
  if (bookingPanel) bookingPanel.style.display = 'none'
  const complaintsPanel = document.getElementById('complaints-panel')
  if (complaintsPanel) complaintsPanel.style.display = 'none'
  const complaintsContent = document.getElementById('complaints-content')
  if (complaintsContent) {
    complaintsContent.innerHTML = '<small class="text-muted">Изберете час, за да видите оплакванията</small>'
  }

  navigateTo('/auth')
}

// ===================================================
// ADMIN PANEL FUNCTIONS
// ===================================================

window.showAdminPanel = async () => {
  try {
    await requireAdminSession()
  } catch (error) {
    alert(error.message)
    navigateTo('/auth')
    return
  }

  const container = document.createElement('div')
  container.className = 'container-fluid py-4'
  
  container.innerHTML = `
    <div class="row">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-danger text-white">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-shield-alt" style="font-size: 20px; margin-right: 8px;"></i> Администраторски панел</h5>
              <div>
                <button class="btn btn-sm btn-outline-light" onclick="window.location.reload()">
                  <i class="fas fa-home" style="margin-right: 6px;"></i> Назад
                </button>
              </div>
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
                  <i class="fas fa-calendar-check" style="margin-right: 6px;"></i> Записани часове
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

async function requireAdminSession() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user?.email) {
    throw new Error('Трябва да сте логнат като администратор.')
  }

  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('id, email, is_active')
    .eq('email', userData.user.email)
    .eq('is_active', true)
    .maybeSingle()

  if (adminError) {
    throw new Error('Неуспешна проверка за админ права.')
  }

  if (!adminData) {
    throw new Error('Нямате администраторски права.')
  }
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
            <td>
              <div class="d-flex align-items-center gap-2">
                ${renderDoctorAvatarImg(doc, 24) || ''}
                <span>${doc.name}</span>
              </div>
            </td>
            <td>${doc.specialty || '-'}</td>
            <td>${doc.email}</td>
            <td>${doc.work_hours_from} - ${doc.work_hours_to}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="window.deleteDoctor('${doc.id}', '${encodeURIComponent(doc.email)}')">
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
              <button class="btn btn-sm btn-danger" onclick="window.deletePatient('${patient.id}', '${encodeURIComponent(patient.email)}')">
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
    let appointments = null

    // Prefer including avatar fields; fallback if DB migration isn't applied yet.
    {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at, doctors(name, avatar_path, avatar_updated_at), patients(name)')
        .order('appointment_date', { ascending: true })

      if (!error) {
        appointments = data
      } else {
        const msg = String(error.message || '')
        const shouldFallback = msg.includes('avatar_path') || msg.includes('avatar_updated_at') || msg.includes('column')
        if (!shouldFallback) throw error

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('appointments')
          .select('id, doctor_id, patient_id, appointment_date, appointment_time, complaints, status, created_at, doctors(name), patients(name)')
          .order('appointment_date', { ascending: true })

        if (fallbackError) throw fallbackError
        appointments = fallbackData
      }
    }
    
    let html = '<div class="table-responsive"><table class="table table-striped">'
    html += '<thead><tr><th>Лекар</th><th>Пациент</th><th>Дата</th><th>Час</th><th>Статус</th><th>Оплаквания</th><th>Действие</th></tr></thead><tbody>'
    
    if (appointments && appointments.length > 0) {
      appointments.forEach(apt => {
        const doc = apt.doctors || {}
        html += `
          <tr>
            <td>
              <div class="d-flex align-items-center gap-2">
                ${renderDoctorAvatarImg(doc, 24) || ''}
                <span>${doc.name || '-'}</span>
              </div>
            </td>
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

window.deleteDoctor = async (doctorId, emailEncoded) => {
  if (!confirm('Сигурни ли сте? Това действие е необратимо.')) return
  
  try {
    const email = decodeURIComponent(emailEncoded || '')
    if (!email) throw new Error('Липсва email за изтриване.')

    const data = await invokeDeleteUser(email)

    const warning = data.authDeleted ? '' : '\n\nЗабележка: Няма намерен потребител в Auth за този email.'
    alert('Лекарят е изтрит успешно!' + warning)
    window.showAdminPanel()
  } catch (error) {
    alert('Грешка при изтриване: ' + error.message)
  }
}

window.deletePatient = async (patientId, emailEncoded) => {
  if (!confirm('Сигурни ли сте? Това действие е необратимо.')) return
  
  try {
    const email = decodeURIComponent(emailEncoded || '')
    if (!email) throw new Error('Липсва email за изтриване.')

    const data = await invokeDeleteUser(email)

    const warning = data.authDeleted ? '' : '\n\nЗабележка: Няма намерен потребител в Auth за този email.'
    alert('Пациентът е изтрит успешно!' + warning)
    window.showAdminPanel()
  } catch (error) {
    alert('Грешка при изтриване: ' + error.message)
  }
}

async function invokeDeleteUser(email) {
  await ensureFreshSession()
  await requireAdminSession()

  const session = await safeGetSession()
  const accessToken = session?.access_token
  if (!accessToken) {
    throw new Error('Липсва access token. Излезте и влезте отново.')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })

  const text = await response.text()
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = null
  }

  if (!response.ok) {
    throw new Error(parsed?.error || parsed?.message || text || `HTTP ${response.status}`)
  }

  if (!parsed?.ok) throw new Error(parsed?.error || 'Неуспешно изтриване.')
  return parsed
}

async function ensureFreshSession() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    throw new Error('Сесията е невалидна. Излезте и влезте отново с админ акаунт.')
  }

  const session = await safeGetSession()
  if (!session) {
    throw new Error('Липсва активна сесия. Моля, излезте и влезте отново.')
  }

  const tokenInfo = parseJwt(session.access_token)
  const expectedIssuer = `${SUPABASE_URL}/auth/v1`
  if (tokenInfo?.iss && tokenInfo.iss !== expectedIssuer) {
    throw new Error('Невалиден токен за този проект. Излезте и влезте отново, или изчистете localStorage ключовете, започващи със "sb-".')
  }

  if (!session.refresh_token) {
    throw new Error('Липсва refresh token. Излезте и влезте отново, или изчистете localStorage ключовете, започващи със "sb-".')
  }

  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
  if (expiresAt && Date.now() > expiresAt - 30 * 1000) {
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data?.session) {
      throw new Error('Сесията е изтекла. Моля, излезте и влезте отново.')
    }
  }
}

function parseJwt(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (payload.length % 4 !== 0) payload += '='
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

async function safeGetSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data?.session || null
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

// Function to show instructions for auth cleanup
window.showAuthCleanupInstructions = () => {
  const message = `ИНСТРУКЦИИ ЗА ИЗТРИВАНЕ НА ОСИРОТЕЛИ АКАУНТИ

Потребителските акаунти в Authentication системата не могат да се изтрият директно от приложението.

За да изтриете осиротели акаунти, следвайте следните стъпки в Supabase конзолата:

1. Отворете вашия Supabase проект
2. Отидете на вкладката "Authentication"
3. Изберете "Users"
4. Намерете потребителя по email
5. Натиснете иконката с три точки (⋯)
6. Изберете "Delete User"

Алтернативно, ако имате dostup до командния ред на Supabase:
- Използвайте Supabase CLI: supabase auth users delete <user-id>

Нужна помощ? Проверете документацията на Supabase на https://supabase.com/docs`;
  
  alert(message)
}

