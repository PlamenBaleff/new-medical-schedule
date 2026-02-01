// MonthCalendar component - reusable calendar for Home and Schedule pages
export default function MonthCalendar({ onDateSelect, initialDate }) {
  let currentDate = initialDate ? new Date(initialDate) : new Date()
  let selectedDate = null

  const container = document.createElement('div')
  container.innerHTML = `
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
        <div id="calendar-days-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 10px;"></div>
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
  `

  function renderCalendar() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const monthNames = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември']
    const monthYearEl = container.querySelector('#calendar-month-year')
    if (monthYearEl) monthYearEl.textContent = `${monthNames[month]} ${year}`
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()
    const startDay = firstDay === 0 ? 6 : firstDay - 1
    let html = ''
    const today = new Date()
    for (let i = startDay - 1; i >= 0; i--) {
      html += `<button style="padding: 8px 4px; background: #f0f0f0; color: #bbb; border: 1px solid #e0e0e0; border-radius: 4px; cursor: default; font-size: 0.8rem;">${daysInPrevMonth - i}</button>`
    }
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
    const totalCells = startDay + daysInMonth
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
    for (let day = 1; day <= remainingCells; day++) {
      html += `<button style="padding: 8px 4px; background: #f0f0f0; color: #bbb; border: 1px solid #e0e0e0; border-radius: 4px; cursor: default; font-size: 0.8rem;">${day}</button>`
    }
    const daysGrid = container.querySelector('#calendar-days-grid')
    if (daysGrid) {
      daysGrid.innerHTML = html
      daysGrid.querySelectorAll('.cal-day').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedDate = btn.dataset.date
          renderCalendar()
          const dateObj = new Date(selectedDate + 'T00:00:00')
          const monthNames = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември']
          const dayNames = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота']
          const display = container.querySelector('#selected-date-display')
          if (display) {
            display.innerHTML = `<span class="badge bg-success" style="padding: 6px 10px; font-size: 0.8rem;">${dayNames[dateObj.getDay()]}, ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}</span>`
          }
          if (typeof onDateSelect === 'function') {
            onDateSelect(selectedDate)
          }
        })
      })
    }
  }
  container.querySelector('#prev-month-btn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1)
    renderCalendar()
  })
  container.querySelector('#next-month-btn').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1)
    renderCalendar()
  })
  renderCalendar()
  return container
}
