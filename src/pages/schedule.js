// Schedule page component
export default function SchedulePage() {
  const container = document.createElement('div')
  container.className = 'container py-5'
  
  container.innerHTML = `
    <div class="row">
      <div class="col-lg-10 mx-auto">
        <h1 class="mb-4">Doctor Schedule</h1>
        
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Weekly Schedule</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-bordered">
                <thead class="table-light">
                  <tr>
                    <th>Doctor</th>
                    <th>Monday</th>
                    <th>Tuesday</th>
                    <th>Wednesday</th>
                    <th>Thursday</th>
                    <th>Friday</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Dr. Smith</strong></td>
                    <td>09:00 - 17:00</td>
                    <td>09:00 - 17:00</td>
                    <td>09:00 - 17:00</td>
                    <td>OFF</td>
                    <td>09:00 - 17:00</td>
                  </tr>
                  <tr>
                    <td><strong>Dr. Johnson</strong></td>
                    <td>OFF</td>
                    <td>10:00 - 18:00</td>
                    <td>10:00 - 18:00</td>
                    <td>10:00 - 18:00</td>
                    <td>10:00 - 18:00</td>
                  </tr>
                  <tr>
                    <td><strong>Dr. Williams</strong></td>
                    <td>08:00 - 16:00</td>
                    <td>08:00 - 16:00</td>
                    <td>OFF</td>
                    <td>08:00 - 16:00</td>
                    <td>08:00 - 16:00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <button class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> Add New Schedule
        </button>
      </div>
    </div>
  `
  
  return container
}
