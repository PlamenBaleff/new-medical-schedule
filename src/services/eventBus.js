// Event bus for application-wide updates
class EventBus {
  constructor() {
    this.listeners = {}
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
  }

  // Emit an event
  emit(event, data) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(data))
  }

  // Remove all listeners for an event
  clear(event) {
    if (event) {
      delete this.listeners[event]
    } else {
      this.listeners = {}
    }
  }
}

export const eventBus = new EventBus()

// Event types
export const EVENTS = {
  PROFILE_UPDATED: 'profile:updated',
  DOCTOR_UPDATED: 'doctor:updated',
  PATIENT_UPDATED: 'patient:updated',
  DATA_REFRESH_NEEDED: 'data:refresh'
}
