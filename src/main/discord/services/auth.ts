/* eslint-disable import/no-cycle */
/* eslint-disable no-underscore-dangle */

import { Server } from 'http';
import { shell } from 'electron';
import Express, { Request, Response } from 'express';
import got from 'got';
import { setAuthResult } from '../../main';
import { listeningPort, validGuild, validRole } from '../config/config';

import OAuthConfig from '../models/OAuthConfig';
import Guild from '../models/Guild';

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
      if (!req.query.code) setAuthResult(false);

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

        if (!result) setAuthResult(false);

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
            }
          );

          if (!result) setAuthResult(false);
          const guildInfo = JSON.parse(result.body);

          if (guildInfo.roles.includes(validRole)) {
            setAuthResult(true);
          } else {
            setAuthResult(false);
          }
        }
      } catch (err) {
        setAuthResult(false);
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
        this._oauthConfig.redirect_uri
      )}&response_type=code&scope=${encodeURI(this._oauthConfig.scope)}`
    );
  };
}

export default AuthClient;
