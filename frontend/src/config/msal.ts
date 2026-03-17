import { PublicClientApplication, type Configuration } from '@azure/msal-browser'

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    // Must be registered as a SPA redirect URI in Azure AD app registration
    redirectUri: window.location.origin,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    // sessionStorage clears on tab close — safer for shared machines
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

export const msalInstance = new PublicClientApplication(msalConfig)

// Scopes requested during login — only standard OIDC scopes needed
// The ID token returned contains: oid, email, preferred_username, name
export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
}
