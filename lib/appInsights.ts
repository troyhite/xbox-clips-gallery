import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

let reactPlugin: ReactPlugin | null = null;
let appInsights: ApplicationInsights | null = null;

/**
 * Initialize Application Insights for client-side tracking
 */
export const initializeAppInsights = () => {
  const connectionString = process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING;
  
  if (!connectionString) {
    console.warn('Application Insights connection string not found. Add NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING to .env.local');
    return { reactPlugin: null, appInsights: null };
  }

  if (typeof window === 'undefined') {
    return { reactPlugin: null, appInsights: null };
  }

  if (!appInsights) {
    try {
      reactPlugin = new ReactPlugin();
      appInsights = new ApplicationInsights({
        config: {
          connectionString,
          enableAutoRouteTracking: true,
          enableRequestHeaderTracking: true,
          enableResponseHeaderTracking: true,
          enableAjaxErrorStatusText: true,
          enableUnhandledPromiseRejectionTracking: true,
          disableFetchTracking: false,
          enableCorsCorrelation: true,
          enableDebug: process.env.NODE_ENV === 'development',
          extensions: [reactPlugin],
        },
      });
      appInsights.loadAppInsights();
      appInsights.trackPageView();
      console.log('✅ Application Insights initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Application Insights:', error);
    }
  }

  return { reactPlugin, appInsights };
};

/**
 * Track a custom event
 */
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  if (appInsights) {
    appInsights.trackEvent({ name }, properties);
  }
};

/**
 * Track an exception
 */
export const trackException = (error: Error, properties?: Record<string, any>) => {
  if (appInsights) {
    appInsights.trackException({ exception: error }, properties);
  }
};

export { reactPlugin, appInsights };
