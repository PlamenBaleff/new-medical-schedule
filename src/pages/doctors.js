// Doctors page component
import { getDoctors } from '../services/supabase.js'
import { eventBus, EVENTS } from '../services/eventBus.js'
import { renderDoctorAvatarImg } from '../utils/doctorAvatar.js'

export default function DoctorsPage() {
  const container = document.createElement('div')
  container.className = 'container py-5'

  container.innerHTML = `
    <div class="row">
      <div class="col-lg-10 mx-auto">
        <h1 class="mb-4"><i class="fas fa-stethoscope" style="font-size: 24px; margin-right: 8px;"></i> Лекари</h1>
        <div id="doctors-grid" class="row g-4">
          <div class="col-12 text-center text-muted">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      </div>
    </div>
  `

  // Function to load and display doctors
  const loadDoctors = async () => {
    const grid = container.querySelector('#doctors-grid')
    if (!grid) return // Element no longer exists
    
    try {
      const doctors = await getDoctors()
      if (!doctors || doctors.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted">Няма регистрирани лекари.</div>'
        return
      }

      grid.innerHTML = doctors.map(doctor => `
        <div class="col-md-6 col-lg-4">
          <div class="card shadow-sm h-100">
            <div class="card-body text-center">
              <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                ${renderDoctorAvatarImg(doctor, 48) || '<i class="fas fa-user-doctor" style="font-size: 48px; color: #4FC3F7; display: block;"></i>'}
                <h5 class="card-title mb-0">${doctor.name}</h5>
              </div>
              <p class="text-muted small">${doctor.specialty || '-'}</p>
              <p class="small mb-2">
                <i class="fas fa-envelope" style="margin-right: 6px;"></i> ${doctor.email}
              </p>
              <p class="small mb-2">
                <i class="fas fa-phone" style="margin-right: 6px;"></i> ${doctor.phone || 'Не е посочен'}
              </p>
              <p class="small mb-2">
                <i class="fas fa-map-marker-alt" style="margin-right: 6px;"></i> ${doctor.address || 'Не е посочен'}
              </p>
              <p class="small mb-3">
                <i class="fas fa-clock" style="margin-right: 6px;"></i> ${doctor.work_hours_from || '08:00'} - ${doctor.work_hours_to || '17:00'}
              </p>
              <div class="badge bg-success mb-2"><i class="fas fa-check-circle" style="margin-right: 4px;"></i> Наличен</div>
            </div>
          </div>
        </div>
      `).join('')
    } catch (error) {
      const grid = container.querySelector('#doctors-grid')
      if (grid) {
        grid.innerHTML = `<div class="col-12"><div class="alert alert-warning">Неуспешно зареждане на лекари.</div></div>`
      }
    }
  }

  // Load doctors initially
  setTimeout(loadDoctors, 0)

  // Listen for doctor updates and reload
  const unsubscribeDoctorUpdate = eventBus.on(EVENTS.DOCTOR_UPDATED, loadDoctors)

  // Store cleanup function
  container._cleanup = () => {
    unsubscribeDoctorUpdate()
  }

  return container
}
