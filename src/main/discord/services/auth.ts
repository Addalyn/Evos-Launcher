/**
 * @fileoverview Discord OAuth authentication service for account linking
 * Handles Discord OAuth flow, server verification, and user authentication for Discord integration.
 * Manages the Express server for OAuth callbacks and validates user permissions.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/* eslint-disable import/no-cycle */
/* eslint-disable no-underscore-dangle */

import { Server } from 'http';
import { shell } from 'electron';
import Express, { Request, Response } from 'express';
import got from 'got';
import OAuthConfig from '../models/OAuthConfig';
import Guild from '../models/Guild';
import { listeningPort, validGuild, validRole } from '../config/config';

// Define the callback type for auth results
type AuthResultCallback = (status: boolean, guildInfo?: any) => Promise<void>;

let authResultCallback: AuthResultCallback | null = null;
let authResultLinkedCallback: AuthResultCallback | null = null;

export function setAuthCallbacks(
  resultCallback: AuthResultCallback,
  linkedCallback: AuthResultCallback,
): void {
  authResultCallback = resultCallback;
  authResultLinkedCallback = linkedCallback;
}

class AuthClient {
  private _oauthConfig: OAuthConfig;

  private _server: Server;

  private expressApp = Express();

  /**
   * Constructor for initializing our Discord OAuth authorization client
   * @param oauthConfig OAuth configuration options
   */
  constructor(oauthConfig: OAuthConfig) {
    this._oauthConfig = oauthConfig;
    this._server = this.expressApp.listen(listeningPort);

    this.expressApp.get('/auth', async (req: Request, res: Response) => {
      if (!req.query.code) {
        authResultCallback?.(false);
        authResultLinkedCallback?.(false, null);
      }

      const data: OAuthConfig = {
        ...this._oauthConfig,
        code: String(req.query.code),
      };

      try {
        let result = await got.post('https://discordapp.com/api/oauth2/token', {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          form: data,
        });

        if (!result) {
          authResultCallback?.(false);
          authResultLinkedCallback?.(false, null);
        }

        const token: string = JSON.parse(result.body).access_token;

        result = await got('http://discordapp.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        let guildArr: Guild[] = JSON.parse(result.body);

        guildArr = guildArr.filter((guild) => validGuild === guild.id);

        if (guildArr.length > 0) {
          result = await got(
            `http://discordapp.com/api/users/@me/guilds/${validGuild}/member`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!result) authResultCallback?.(false);
          const guildInfo = JSON.parse(result.body);

          if (guildInfo.roles.includes(validRole)) {
            authResultCallback?.(true);
          } else {
            authResultCallback?.(false);
          }
          authResultLinkedCallback?.(true, guildInfo as Guild);
        } else {
          authResultCallback?.(false);
          authResultLinkedCallback?.(false, null);
        }
      } catch (err) {
        authResultCallback?.(false);
        authResultLinkedCallback?.(false, null);
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>You can now close this page.</title>
          <script> window.close(); </script>
        </head>
        <body>
          <p>You can now close this page.</p>
        </body>
        </html>
      `);
    });
  }

  /**
   * Closes the http server and prevents further requests
   */
  public stopListening = () => {
    this._server.close();
  };

  public isListening = () => {
    return this._server.listening;
  };

  /**
   * Opens the current default browser on the system to the Discord OAuth authentication page
   */
  public openBrowser = (): void => {
    shell.openExternal(
      `https://discord.com/api/oauth2/authorize?client_id=${
        this._oauthConfig.client_id
      }&redirect_uri=${encodeURI(
        this._oauthConfig.redirect_uri,
      )}&response_type=code&scope=${encodeURI(this._oauthConfig.scope)}`,
    );
  };
}

export default AuthClient;
