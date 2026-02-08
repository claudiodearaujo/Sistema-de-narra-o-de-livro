export const environment = {
  production: true,
  apiUrl: 'https://sistema-de-narra-o-de-livro.onrender.com/api',  // Update with production URL
  wsUrl: 'https://sistema-de-narra-o-de-livro.onrender.com',        // Update with production WS URL
  
  // Push Notifications VAPID Key (set via CI/CD or build process)
  vapidPublicKey: '',  // Set your VAPID public key here
  
  // Auth configuration
  auth: {
    tokenExpirationMinutes: 60,
    refreshTokenEnabled: true,
    rememberMeDays: 30
  },
  
  // Story configuration
  story: {
    durationMs: 5000  // Duration in milliseconds for each story (5 seconds)
  },
  
  // Feature flags
  features: {
    socialNetwork: true,
    emailVerification: true,
    twoFactorAuth: false,
    pushNotifications: true
  }
};
