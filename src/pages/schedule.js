// Schedule page component
import { getDoctors } from '../services/supabase.js'
import { eventBus, EVENTS } from '../services/eventBus.js'

export default function SchedulePage() {
  const container = document.createElement('div')
  container.className = 'container py-5'

  container.innerHTML = `
    <div class="row">
      <div class="col-lg-10 mx-auto">
        <h1 class="mb-4">График на лекари</h1>

        <div class="card shadow-sm mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Седмичен график</h5>
          </div>
          <div class="card-body">
            <div id="schedule-table" class="table-responsive">
              <div class="text-center text-muted">
                <div class="spinner-border text-primary" role="status"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Function to load and display schedule
  const loadSchedule = async () => {
    const tableContainer = container.querySelector('#schedule-table')
    if (!tableContainer) return // Element no longer exists
    
    try {
      const doctors = await getDoctors()
      if (!doctors || doctors.length === 0) {
        tableContainer.innerHTML = '<div class="text-center text-muted">Няма регистрирани лекари.</div>'
        return
      }

      const rows = doctors.map(doc => {
        const hours = `${doc.work_hours_from || '08:00'} - ${doc.work_hours_to || '17:00'}`
        return `
          <tr>
            <td><strong>${doc.name}</strong></td>
            <td>${hours}</td>
            <td>${hours}</td>
            <td>${hours}</td>
            <td>${hours}</td>
            <td>${hours}</td>
          </tr>
        `
      }).join('')

      tableContainer.innerHTML = `
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th>Лекар</th>
              <th>Понеделник</th>
              <th>Вторник</th>
              <th>Сряда</th>
              <th>Четвъртък</th>
              <th>Петък</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `
    } catch (error) {
      const tableContainer = container.querySelector('#schedule-table')
      if (tableContainer) {
        tableContainer.innerHTML = '<div class="alert alert-warning">Неуспешно зареждане на графика.</div>'
      }
    }
  }

  // Load schedule initially
  setTimeout(loadSchedule, 0)

  // Listen for doctor updates and reload schedule
  const unsubscribeDoctorUpdate = eventBus.on(EVENTS.DOCTOR_UPDATED, loadSchedule)

  // Cleanup listeners when page is unloaded
  const originalRemoveChild = container.parentElement?.removeChild.bind(container.parentElement)
  if (originalRemoveChild) {
    // Store the unsubscribe function on the container for cleanup
    container._cleanup = () => {
      unsubscribeDoctorUpdate()
    }
  }

  return container
}
