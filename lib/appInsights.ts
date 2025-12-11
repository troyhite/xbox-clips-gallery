import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

let reactPlugin: ReactPlugin | null = null;
let appInsights: ApplicationInsights | null = null;

/**
 * Initialize Application Insights
 */
export const initializeAppInsights = () => {
  const connectionString = process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING;
  
  if (!connectionString) {
    console.warn('Application Insights connection string not found');
    return { reactPlugin: null, appInsights: null };
  }

  if (!reactPlugin) {
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
        extensions: [reactPlugin],
      },
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();
  }

  return { reactPlugin, appInsights };
};

export { reactPlugin, appInsights };
