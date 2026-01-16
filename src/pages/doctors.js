// Doctors page component
export default function DoctorsPage() {
  const container = document.createElement('div')
  container.className = 'container py-5'
  
  container.innerHTML = `
    <div class="row">
      <div class="col-lg-10 mx-auto">
        <h1 class="mb-4">Medical Staff</h1>
        
        <div class="row g-4">
          <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="bi bi-person-fill display-4 text-primary"></i>
                </div>
                <h5 class="card-title">Dr. Smith</h5>
                <p class="text-muted small">Cardiologist</p>
                <p class="small mb-3">
                  <i class="bi bi-telephone"></i> +1 (555) 123-4567
                </p>
                <div class="badge bg-success mb-2">Available</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="bi bi-person-fill display-4 text-primary"></i>
                </div>
                <h5 class="card-title">Dr. Johnson</h5>
                <p class="text-muted small">Neurologist</p>
                <p class="small mb-3">
                  <i class="bi bi-telephone"></i> +1 (555) 234-5678
                </p>
                <div class="badge bg-success mb-2">Available</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="bi bi-person-fill display-4 text-primary"></i>
                </div>
                <h5 class="card-title">Dr. Williams</h5>
                <p class="text-muted small">Dermatologist</p>
                <p class="small mb-3">
                  <i class="bi bi-telephone"></i> +1 (555) 345-6789
                </p>
                <div class="badge bg-warning mb-2">On Leave</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-5">
          <button class="btn btn-primary">
            <i class="bi bi-plus-lg"></i> Add Doctor
          </button>
        </div>
      </div>
    </div>
  `
  
  return container
}
