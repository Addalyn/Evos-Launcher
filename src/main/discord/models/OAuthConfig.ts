// Interface for Discord OAuth request
interface OAuthConfig {
  client_id: string;
  client_secret: string;
  grant_type: string;
  redirect_uri: string;
  code?: string;
  scope: string;
}

export default OAuthConfig;
