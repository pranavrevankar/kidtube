// Sentry initialization for frontend
// This file should be loaded before other scripts
(function() {
  // Check if Sentry DSN is provided via window object
  if (window.SENTRY_DSN) {
    // Dynamically load Sentry SDK
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/7.99.0/bundle.min.js';
    script.integrity = 'sha384-8zeqMfVZpyxZZHHVoK13yMFi3kqZ4NEV5I6yEMD8h0v4i3W/0VFy9shA5s8xr9VC';
    script.crossOrigin = 'anonymous';

    script.onload = function() {
      window.Sentry.init({
        dsn: window.SENTRY_DSN,
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        integrations: [
          new window.Sentry.BrowserTracing(),
          new window.Sentry.Replay({
            maskAllText: false,
            blockAllMedia: false,
          })
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions
        // Session Replay
        replaysSessionSampleRate: 0.1, // Sample 10% of sessions
        replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
      });

      console.log('Sentry initialized on frontend');
    };

    document.head.appendChild(script);
  }
})();
