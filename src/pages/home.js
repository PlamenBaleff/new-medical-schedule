// Home page component
export default function HomePage() {
  const container = document.createElement('div')
  container.className = 'container py-5'
  
  container.innerHTML = `
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <h1 class="display-4 mb-4">Welcome to Medical Schedule</h1>
        <p class="lead mb-4">
          Manage doctor schedules, appointments, and medical staff efficiently.
        </p>
        
        <div class="row g-4 mb-5">
          <div class="col-md-6">
            <div class="card h-100 shadow-sm">
              <div class="card-body text-center">
                <i class="bi bi-calendar-check display-4 text-primary mb-3"></i>
                <h5 class="card-title">Manage Schedule</h5>
                <p class="card-text">View and manage doctor schedules and appointments</p>
                <a href="#schedule" class="btn btn-primary">Go to Schedule</a>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="card h-100 shadow-sm">
              <div class="card-body text-center">
                <i class="bi bi-people display-4 text-success mb-3"></i>
                <h5 class="card-title">View Doctors</h5>
                <p class="card-text">See all doctors and their availability</p>
                <a href="#doctors" class="btn btn-success">View Doctors</a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i>
          <strong>Getting Started:</strong> Configure your Supabase credentials in the Settings page to enable backend functionality.
        </div>
      </div>
    </div>
  `
  
  return container
}
