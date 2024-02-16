/* eslint-disable import/no-mutable-exports */
/* eslint-disable camelcase */
import OAuthConfig from '../models/OAuthConfig';

const getSecrets = 'https://media.evos.live/getsecrets.json';

const oauthConfig: OAuthConfig = {
  client_id: '',
  client_secret: '',
  grant_type: '',
  redirect_uri: '',
  scope: '',
};

const listeningPort: number = 5005;
let validGuild: string = '';
let validRole: string = '';

async function setSecrets() {
  const request = new Request(getSecrets, {
    headers: new Headers({
      'Content-Type': 'application/json',
      'User-Agent': 'Evos Launcher',
    }),
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(
      `Unable to download, server returned ${response.status} ${response.statusText}`,
    );
  }

  const {
    client_id,
    client_secret,
    grant_type,
    redirect_uri,
    scope,
    valid_Guild,
    valid_Role,
  } = await response.json();
  oauthConfig.client_id = client_id;
  oauthConfig.client_secret = client_secret;
  oauthConfig.grant_type = grant_type;
  oauthConfig.redirect_uri = redirect_uri;
  oauthConfig.scope = scope;
  validGuild = valid_Guild;
  validRole = valid_Role;
}

setSecrets();

export { oauthConfig, listeningPort, validGuild, validRole };
