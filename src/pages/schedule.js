// Schedule page component
import { getDoctors } from '../services/supabase.js'
import { eventBus, EVENTS } from '../services/eventBus.js'

export default function SchedulePage() {
  const container = document.createElement('div')
  container.className = 'container-fluid py-4 px-3 px-md-4'

  // Variables for calendar
  let currentDate = new Date()
  let selectedDate = null

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 350px; gap: 20px; grid-auto-flow: row;">
      <div>
        <h1 class="mb-4"><i class="fas fa-calendar-week" style="font-size: 28px; margin-right: 12px;"></i> График на лекари</h1>

        <div class="card shadow-sm mb-4" style="border: none; border-radius: 16px;">
          <div class="card-header" style="background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%); color: white; border-radius: 16px 16px 0 0; padding: 20px;">
            <h5 class="mb-0"><i class="fas fa-stethoscope" style="font-size: 20px; margin-right: 8px;"></i> Наличност на лекари</h5>
          </div>
          <div class="card-body p-3">
            <div id="schedule-table">
              <div class="text-center text-muted">
                <div class="spinner-border text-primary" role="status"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="grid-column: 2; grid-row: 1 / 3;">
        <!-- Info Panel -->
        <div class="card shadow-sm mb-4" style="border: none; border-radius: 16px; background: linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 100%);">
          <div class="card-header" style="background: linear-gradient(135deg, #81C784 0%, #66BB6A 100%); color: white; border-radius: 16px 16px 0 0; padding: 12px 15px;">
            <h5 class="mb-0" style="font-size: 1rem;"><i class="fas fa-info-circle" style="margin-right: 8px;"></i> Информация</h5>
          </div>
          <div class="card-body" style="padding: 12px 15px;">
            <div class="mb-3">
              <h6 class="mb-2" style="font-size: 0.9rem;"><i class="fas fa-circle-info" style="margin-right: 6px; color: #4FC3F7;"></i> <strong>Легенда</strong></h6>
              <div class="mb-2">
                <span class="badge" style="background-color: #EF5350; color: white; padding: 6px 10px; font-size: 0.75rem;">Заразен</span>
                <small class="d-block text-muted mt-1" style="font-size: 0.75rem;">Времето не е налично</small>
              </div>
              <div>
                <span class="badge" style="background-color: #66BB6A; color: white; padding: 6px 10px; font-size: 0.75rem;">Свободен</span>
                <small class="d-block text-muted mt-1" style="font-size: 0.75rem;">Времето е налично</small>
              </div>
            </div>

            <hr class="my-2" style="margin: 10px 0;">

            <div class="mb-3">
              <h6 class="mb-2" style="font-size: 0.9rem;"><i class="fas fa-users" style="margin-right: 6px; color: #FFB74D;"></i> <strong>Лекари</strong></h6>
              <p class="text-center mb-0">
                <span class="badge bg-primary p-2" style="font-size: 0.9rem;" id="doctor-count">-</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Month Calendar -->
        <div class="card shadow-sm" style="border: none; border-radius: 16px; background: linear-gradient(135deg, #E1F5FE 0%, #F3E5F5 100%); overflow: hidden;">
          <div class="card-header" style="background: linear-gradient(135deg, #4DD0E1 0%, #26C6DA 100%); color: white; border-radius: 16px 16px 0 0; padding: 10px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h5 class="mb-0" style="font-size: 0.95rem;"><i class="fas fa-calendar" style="margin-right: 6px;"></i> <span id="calendar-month-year">Януари</span></h5>
              <div>
                <button class="btn btn-sm btn-light" id="prev-month-btn" style="padding: 2px 5px; border-radius: 3px; margin-right: 2px; border: none; cursor: pointer; font-size: 0.75rem;">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="btn btn-sm btn-light" id="next-month-btn" style="padding: 2px 5px; border-radius: 3px; border: none; cursor: pointer; font-size: 0.75rem;">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="card-body" style="padding: 10px 12px;">
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 8px; font-size: 0.65rem;">
              <div class="text-center" style="font-weight: 700; color: #666;">ПН</div>
              <div class="text-center" style="font-weight: 700; color: #666;">ВТ</div>
              <div class="text-center" style="font-weight: 700; color: #666;">СР</div>
              <div class="text-center" style="font-weight: 700; color: #666;">ЧТ</div>
              <div class="text-center" style="font-weight: 700; color: #666;">ПТ</div>
              <div class="text-center" style="font-weight: 700; color: #666;">СБ</div>
              <div class="text-center" style="font-weight: 700; color: #666;">НД</div>
            </div>
            <div id="calendar-days-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 10px;">
              <div style="padding: 4px; text-align: center; color: #999; font-size: 0.7rem;">1</div>
              <div style="padding: 4px; text-align: center; color: #999; font-size: 0.7rem;">2</div>
              <div style="padding: 4px; text-align: center; color: #999; font-size: 0.7rem;">3</div>
              <div style="padding: 4px; text-align: center; color: #999; font-size: 0.7rem;">4</div>
              <div style="padding: 4px; text-align: center; color: #999; font-size: 0.7rem;">5</div>
              <div style="padding: 4px; text-align: center; color: #999; font-size: 0.7rem;">6</div>
              <div style="padding: 4px; text-align: center; color: #999; font-size: 0.7rem;">7</div>
            </div>
            <div class="p-2" style="background: rgba(255,255,255,0.9); border-radius: 6px; border: 1px solid #E0E0E0; font-size: 0.8rem;">
              <p class="text-muted mb-1" style="margin-bottom: 4px; font-size: 0.75rem;">
                <i class="fas fa-hand-pointer" style="margin-right: 4px;"></i> <strong>Избран ден:</strong>
              </p>
              <p class="mb-0" id="selected-date-display">
                <span class="badge bg-info" style="font-size: 0.7rem;">Кликни</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // CALENDAR RENDERING FUNCTION
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Update header month/year
    const monthNames = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември']
    const monthYearEl = container.querySelector('#calendar-month-year')
    if (monthYearEl) {
      monthYearEl.textContent = `${monthNames[month]} ${year}`
    }
    
    // Calculate calendar structure
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()
    const startDay = firstDay === 0 ? 6 : firstDay - 1
    
    let html = ''
    const today = new Date()
    
    // Previous month's days
    for (let i = startDay - 1; i >= 0; i--) {
      html += `<button style="padding: 8px 4px; background: #f0f0f0; color: #bbb; border: 1px solid #e0e0e0; border-radius: 4px; cursor: default; font-size: 0.8rem;">${daysInPrevMonth - i}</button>`
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dateObj = new Date(year, month, day)
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
      const isSelected = selectedDate === dateStr
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6
      
      let bgColor = '#fff'
      let textColor = '#333'
      let border = '1px solid #ddd'
      let fontWeight = 'normal'
      
      if (isSelected) {
        bgColor = '#81C784'
        textColor = '#fff'
        border = '2px solid #66BB6A'
        fontWeight = 'bold'
      } else if (isToday) {
        bgColor = '#4FC3F7'
        textColor = '#fff'
        border = '2px solid #029BE5'
        fontWeight = 'bold'
      } else if (isWeekend) {
        bgColor = '#f5f5f5'
        border = '1px solid #ddd'
      }
      
      html += `<button class="cal-day" data-date="${dateStr}" style="padding: 8px 4px; background: ${bgColor}; color: ${textColor}; border: ${border}; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: ${fontWeight}; transition: all 0.2s;">${day}</button>`
    }
    
    // Next month's days
    const totalCells = startDay + daysInMonth
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
    for (let day = 1; day <= remainingCells; day++) {
      html += `<button style="padding: 8px 4px; background: #f0f0f0; color: #bbb; border: 1px solid #e0e0e0; border-radius: 4px; cursor: default; font-size: 0.8rem;">${day}</button>`
    }
    
    const daysGrid = container.querySelector('#calendar-days-grid')
    if (daysGrid) {
      daysGrid.innerHTML = html
      
      // Add click handlers
      daysGrid.querySelectorAll('.cal-day').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedDate = btn.dataset.date
          renderCalendar()
          
          // Update display
          const dateObj = new Date(selectedDate + 'T00:00:00')
          const monthNames = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември']
          const dayNames = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота']
          
          const display = container.querySelector('#selected-date-display')
          if (display) {
            display.innerHTML = `<span class="badge bg-success" style="padding: 6px 10px; font-size: 0.8rem;">${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}</span>`
          }
        })
      })
    }
  }
  
  // Month navigation
  const prevBtn = container.querySelector('#prev-month-btn')
  const nextBtn = container.querySelector('#next-month-btn')
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1)
      renderCalendar()
    })
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1)
      renderCalendar()
    })
  }

  // Function to load and display schedule
  const loadSchedule = async () => {
    const tableContainer = container.querySelector('#schedule-table')
    if (!tableContainer) return
    
    try {
      const doctors = await getDoctors()
      if (!doctors || doctors.length === 0) {
        tableContainer.innerHTML = '<div class="text-center text-muted">Няма регистрирани лекари.</div>'
        return
      }

      const rows = doctors.map(doc => {
        const hours = `${doc.work_hours_from || '08:00'} - ${doc.work_hours_to || '17:00'}`
        
        const timeSlots = []
        const startHour = parseInt(doc.work_hours_from?.split(':')[0] || '08')
        const endHour = parseInt(doc.work_hours_to?.split(':')[0] || '17')
        
        for (let i = startHour; i < endHour; i++) {
          const timeStr = `${String(i).padStart(2, '0')}:00`
          const isFree = Math.random() > 0.5
          const badgeColor = isFree ? '#66BB6A' : '#EF5350'
          const badgeText = isFree ? 'Свободен' : 'Заразен'
          timeSlots.push(`
            <div class="time-slot mb-2">
              <button class="btn btn-sm w-100" style="background-color: ${badgeColor}; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; text-align: left;">
                <i class="fas ${isFree ? 'fa-check-circle' : 'fa-times-circle'}" style="margin-right: 6px;"></i>
                <strong>${timeStr}</strong> - ${badgeText}
              </button>
            </div>
          `)
        }
        
        return `
          <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
            <div class="card h-100 shadow-sm" style="border: none; border-radius: 12px; overflow: hidden;">
              <div class="card-header" style="background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%); color: white; padding: 15px;">
                <h6 class="mb-1"><i class="fas fa-user-md" style="margin-right: 8px;"></i> ${doc.name}</h6>
                <small>${doc.specialty || 'Лекар'}</small>
              </div>
              <div class="card-body" style="max-height: 450px; overflow-y: auto;">
                <small class="text-muted d-block mb-3">
                  <i class="fas fa-clock" style="margin-right: 4px;"></i> ${hours}
                </small>
                ${timeSlots.join('')}
              </div>
            </div>
          </div>
        `
      }).join('')

      tableContainer.innerHTML = `<div class="row" id="doctors-schedule-grid">${rows}</div>`

      const doctorCountBadge = container.querySelector('#doctor-count')
      if (doctorCountBadge) {
        doctorCountBadge.textContent = doctors.length
      }
    } catch (error) {
      const tableContainer = container.querySelector('#schedule-table')
      if (tableContainer) {
        tableContainer.innerHTML = '<div class="alert alert-warning">Неуспешно зареждане на графика.</div>'
      }
    }
  }

  // Винаги визуализирай календара, независимо от графика
  setTimeout(() => renderCalendar(), 0)
  // Зареди графика
  loadSchedule()

  // Listen for doctor updates
  const unsubscribeDoctorUpdate = eventBus.on(EVENTS.DOCTOR_UPDATED, loadSchedule)

  // Cleanup
  container._cleanup = () => {
    unsubscribeDoctorUpdate()
  }

  return container
}
