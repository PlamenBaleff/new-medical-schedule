// Settings page component
export default function SettingsPage() {
  const container = document.createElement('div')
  container.className = 'container py-5'
  
  container.innerHTML = `
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <h1 class="mb-4">Settings</h1>
        
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Supabase Configuration</h5>
          </div>
          <div class="card-body">
            <form id="settingsForm">
              <div class="mb-3">
                <label for="supabaseUrl" class="form-label">Supabase URL</label>
                <input type="url" class="form-control" id="supabaseUrl" 
                       placeholder="https://xxxxx.supabase.co">
              </div>
              
              <div class="mb-3">
                <label for="supabaseKey" class="form-label">Supabase Anon Key</label>
                <input type="password" class="form-control" id="supabaseKey" 
                       placeholder="Your anonymous key">
              </div>
              
              <button type="submit" class="btn btn-primary">
                Save Settings
              </button>
            </form>
          </div>
        </div>
        
        <div class="card shadow-sm">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0">About</h5>
          </div>
          <div class="card-body">
            <p><strong>Application:</strong> Medical Schedule</p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Built with:</strong> HTML, CSS, JavaScript, Vite, Bootstrap, Supabase</p>
          </div>
        </div>
      </div>
    </div>
  `
  
  // Handle form submission
  container.addEventListener('submit', (e) => {
    if (e.target.id === 'settingsForm') {
      e.preventDefault()
      const url = document.getElementById('supabaseUrl').value
      const key = document.getElementById('supabaseKey').value
      
      if (url && key) {
        localStorage.setItem('supabaseUrl', url)
        localStorage.setItem('supabaseKey', key)
        alert('Settings saved successfully!')
      } else {
        alert('Please fill in all fields')
      }
    }
  })
  
  return container
}
