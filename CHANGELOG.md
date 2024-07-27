### Release Notes: Version 2.1.4

## Additions

- **Top20 Stats**
  - Added the following stats to the Top20 Stats page:
    - Players who needed the most healing (per game on avarage) (min 50 games)
    - Players who collected the most powerups (per game on avarage) (min 50 games)
    - Players who got the most reduced damage from cover (per game on avarage) (min 50 games)
    - Players who got the most extra damage from might (per game on avarage) (min 50 games)
    - Players who got the most reduced damage from weaken (per game on avarage) (min 50 games)
    - Players who denied the most movement (per game on avarage) (min 50 games)
    - Players who sighted the most enemies (per game on avarage) (min 50 games)
    - Players who collected the most accolades

## Improvements

- **Skeleton Loading**
  - Added skeleton loading (to improve the user experience while waiting for the data to load.)
    - Global Stats
      - Games Played Per Month
      - Games Played Per Character
    - Persional Stats
      - Player Banner
      - All Total Stats
      - ALL Posible Wins / Losses / Winrate
      - Games Played Per Month
      - Games Played Per Character

- **Games Played (| by user)**
  - Now fetches games from last 5 years instead of 1 year.
  - If the month has no data the month will not be shown.

- **Wins and Losses**
  - Now fetches games from last 5 years instead of 1 year.
  - If the month has no data the month will not be shown.

### Release Notes: Version 2.1.3 - The Furrbal

## New Features

- **Isadora**
  - Added Isadora

### Release Notes: Version 2.1.2

## New Features

- **Wiki**
  - Added a Wiki page to the launcher, where you can find information about the game, freelancers, and more.

**Note:** Wiki is not complete yet; more information will be added as i work on it, As it does not require a launcher update to update the wiki.

### Release Notes: Version 2.1.1

## Improvements

- **Mentor**

  - Because of new Mentor ICON in game i have changed the launcher to be same icon
  - Icon is moved next to the name of the player
  - Special Effect for mentors is now orange (same as icon)
  - Changed title of Mentors to `Mentor` (Looking at stats outside the game) and `Mentor/Online` `Mentor/In Game` etc... when they are online

## Bug Fixes

- **Launcher update**

  - Rounded the percentage of the text

- **Username**

  - When a username is to long it will be a smaller font size to fit the box (On the Player box thingie)

### Release Notes: Version 2.1.0 - Such thing as too much stats?

## New Features

- **More Stats!**
  - Added Advanced Stats to Previous Games, now you can see more stats about the game you played.
  - Extra stats include:
    - Total Healing Received
    - Total Player Absorb
    - Powerups Collected
    - Damage Reduced by Cover
    - Extra Damage from Might
    - Reduced Damage from Weaken
    - Movement Denied
    - Enemies Sighted
    - Prep Catalyst and used or not
    - Dash Catalyst and used or not
    - Combat Catalyst and used or not
  - But wait! there's more!
  - Ability History: see stats about the abilities you used
    - Ability Name (Hovering over it will show the description of the ability; the values are WITHOUT mods)
    - Action Type (Placement of ability button on the bar)
    - Cast Count
    - Total Absorb
    - Total Damage
    - Total Energy Gain on Self
    - Total Energy Gain to Others
    - Total Potential Absorb
    - Total Targets Hit
    - Taunt Count

## Improvements

- **Colors**

  - Adjusted the win and lose colors to be more lighter.

- **Accolades in game and on launcher**
  - Accolades now reflect the same in the game and on the launcher.

## Bug Fixes

- **Localization**
  - Poor Oz missing localization due to Evos Server Stats API, which should have been fixed in the first place.

**Note:** This is not the end of the update; more stats are coming soon! For example, more top 20 stats! Soon™

### Release Notes: Version 2.0.11

## New Features

- **Let Fire Burn You**
  - Added Lex to the stats and translation.

## Improvements

- **Personal Stats**
  - Optimized personal stats to render character stats only when clicked, improving performance.

### Release Notes: Version 2.0.10

## Improvements

- **Mentors**
  - Added special effects for Mentors

## Bug Fixes

- **Fix Github formating**
  - Format with Markdown github messages

### Release Notes: Version 2.0.9

## Improvements

- **Status Changes**:
  - Now uses WebSocket to fetch in-game status. No longer need to wait 20 seconds; WebSocket will fetch status and broadcast it to everyone connected.

## Bug Fixes

- **Enhanced Character Stats**:
  - Fixed tooltip getting cropped when selecting the far-right dataset.
  - Fixed typo in healing done.

### Release Notes: Version 2.0.8

## Improvements

- **Enhanced Character Stats**:
  - Added additional statistics to character stats:
    - Average damage done overall in the last 20 games.
    - Average damage done by yourself in the last 20 games.
    - Average healing done overall in the last 20 games.
    - Average healing done by yourself in the last 20 games.
    - Average damage received overall in the last 20 games.
    - Average damage received by yourself in the last 20 games.

### Release Notes: Version 2.0.7

## New Features

- **Game Type and Unique Player Count Display**:
  - Game type and unique player count are now shown next to each game, making it easier to identify the game at a glance.

## Improvements

- **Player List Management**:
  - Players are automatically returned to the player list once a game is stopped.

### Release Notes: Version 2.0.6

## New Features

- **Enhanced Personal Stats**:
  - Added detailed graphs displaying performance metrics for the last 20 PvP games.
  - Metrics include damage, healing, damage taken, and deaths per game.
  - Default metric views:
    - Firepowers: Damage
    - Support: Healing
    - Frontliners: Damage Taken
  - Interactive legend: Click to show or hide specific stats as needed.

## Bug Fixes

- **Updater Restart Button**:
  - Resolved issue with the updater restart button not appearing after receiving a delayed translation request message.
  - The restart button now consistently appears once the download is complete, regardless of other incoming messages.

# 2.0.5

- Fixed Magnus abilitys not showing for viewing past games in replay popup.
- You no longer can see other players winrate but only your own.

# 2.0.4 - The dino update

- Added Magnus

# 2.0.3 - The Discord Status Update

- Discord Status update, Now you can see your launcher/In Game status in discord.
  - you can enable/disable it in the settings page
  - This will show
    - If you are in the launcher and not in game (Ideling in the launcher)
    - If you are in in game (Playing Atlas Reactor as `Username`)
    - If you are in game and playing map It will show curent game and what character you are, what map you are on, curent score and time in game.

# 2.0.2 - Just a chill update

- Added Vonn
- Fix a rare case of being logged out before an actual password change,

# 2.0.1

- Fixed downloading the game , will no longer open discord auth and check role, it wil now based on wheter they have linked their discord account or not.
- Added the play button back on top of the launcher, when not setting the game path it will be disabled hover over it to see why.
- Fixed if game was unable to launc , by lets say removing the exe file, the button reverts to play and message why it was unable to launch.
- Fixed and cached special effects data so it does not request it every for x amount of players, cache is 1min

# 2.0.0 - This should have been 2.0.1!

- Added a legend in status page about all the effects posible in the launher (MVP, Tournament Winner, Nitro Booster, Developer) collapsed by default
- Add a visual way to see if you are in any of the top 20 stats, so you can find yourself easier.
- Added Link With Code, this is a way to link your discord account if you are unable to do it the normal way.
  - To get a code, go to Discord server and type `/link` in any channel, this will give you a code that you can use in the launcher.
  - Once used your account will be linked to your discord account.
  - It will not give you a code if your discord account is already linked to another account. it will tell you what account is linked with it.

# 1.9.9 - Discord update

- Stats Prior to version `1.9.8` will no longer work, you need version `1.9.9` or higher to get stats.
  - And you get a nice big image that says you need to update the launcher if you try to use the old version. this is gone if you update the launcher.
- Viewing Stats now requires you to link your discord account! this is a requirement.
- You can now link your discord just click the button thats says "Link Discord".
  - This will open a new window where you can login to discord and give us access to your discord account (using Discord Oficial API).
  - We only need your discord id and username, we do not store any other information.
  - Giving access will gives us a list of servers you are in (we only check if you are in ours `server id: 600425662452465701`).
  - Linking does not matter what role you have for this (it is still a requerment for downloading the game).
- if you do not link your discord you will never get MVP, Tournament Winner or Nitro Booster status. and you will not be able to see your stats or others or see previus games. Tho you may play the game without it.
- I will give people some time to link their discord before i start to remove the old effects and MVP,Etc.. status (26days).
- if for some reason you need to unlink your discord you can do so by typing `/unlink` (Soon™) in any of our discord channels.
- if you are unable to link/unlink your account you can contact us on discord to do it for you.
- Special effects are now database driven and things like `MVP (TOP5 IN ANY STAT)` will Soon™ be automaticly done (26days).

# 1.9.8 - The bots update

- Due to server releasing bots i fixed the launcher for this.
  - You cannot click a bot now to see its "profile" page
  - Fixed Replays to work with bots
  - Some smaller fixes for them
- Global stats removed (total \*\*\* / games played) from stats text
  - for some stats kills, deaths, deathblows it is still calculated as (total \*\*\* / games played)
  - for damage done, healing done, damage taken calculation is now (total \*\*\* / games played )/(( total deaths / games played)+1) so these account now for deaths to.
- Removed Tournament Page, and replaced it with search option in previous games for PvP, Coop(Solo), Custom and Tournaments games
- Changed Babymillie name to my new name BabyAddalyn that is the name i go by now.

# 1.9.7

- Added 7 more stats in global
  - Most kills on avarage (Total/Games Played)
  - Least deaths on avarage (Total/Games Played)
  - Most deaths on avarage (Total/Games Played)
  - Most deathblows on avarage (Total/Games Played)
  - Most damage done on avarage (Total/Games Played)
  - Most healing done on avarage (Total/Games Played)
  - Most damage taken on avarage (Total/Games Played)

* Do note these are only calculated if you have played 200+ games, cause a player could have 1 game played and be nr 1, i do not want that, 200 is a number that could change in future.

- added a new effect for `special` people rainbow! and ofc im a girl i like pretty things. i got one to xD

# 1.9.6

- Fix outline on the user switcher if you had special color (dev,mvp,nitro,tournament winner)
- Added win/loss/winrate to individual freelancer stats (Also works per map or all maps)
- Added navbar on bottom of the previous games page

# 1.9.5

- Added Tournament games, shows only games in the tournament
- Added special border for players
  - Tournament Winner
  - MVP
  - Developers
  - Nitro Boosters

# 1.9.4

- Bring back play button on top of launcher
- Added (for the year) to stats that only totals for the year (plus translations)
- fix if theres no notifications it will not show the empty box
- Reorderd Cloudspire Christmass to end of the list of maps

# 1.9.3

- Translation fixes and new translation added for dodging games
- Faillback if language doesnt exist for MOTD and Notifications to english.
- Added new admin message if you have dodged games in the past 7 days.
  If you feel like this is a false positive please contact us on discord with the reason why you think this is a false positive.
- Added a fallback reset application if for some reason the application is not working as it should. this is `ctrl+F2`.
  This will reset your config file and you will need to relogin and set your settings again.
- Fixed an issue where if you build the Launcher you would needed to use npm install --force this is fixed as the npm package that was causing issues has been updated.
- Redesigned UIX, custom titlebar, moved launch game button to top left above motd, moved language selection and darkmode to settings page. and more tweaks and fixes.
- Made splash screen dragable

# 1.9.2

- Add a periodicly check for updates, no need to restart Launcher again if theres a new update..
- Added account Lock check, if your account is banned you will not be able to login, it will say untill you are banned and the reason.
- Added account admin message, if you have a warning or a message from the admin it will show up in the launcher.
- re did user switcher, using the Player object,
- Added titles to Player object if we use them for custom use
- Because of using custom switcher if you are not logged in , you will need to relogin, so we can validate the user. they need to be logged in anyway for all features to work.
- added Turkish translation to the launcher.
- Fixed the status page having whitespaces between users.
- Fixed motd and notifications spacings to read better.

# 1.9.1

- Add ability icons to replays, on hover show the Mod used, title and description. (not translatable, unless you want to translate allcharacters*5*(4 or 5 mods) texts, Mods.json is 4989 lines :P)
- Made splash screen a bit more fancy (not translatable)
- translation fixes
- Added alert when updating and restarting the launcher

# 1.9.0

- There is now a open replay button in previues games, this will allow you to open the replay file from server,
- You can download the replay file to.
- You can copy the command to play the replay file in game and you can also launch the game from same window
- fixed an issue with replay files that if it has multiple same users it would show catalaysts multiple times
- Added ZH simplefyed chinese language to the launcher

# 1.8.9 - The replays fix 2

- fixes a issue where players did not match the replay file and game data (mostly cause of custom games)
- added search for GameServerProcessCode from replay file to get the stats from api server, if that returns nothing it will use the old way of getting the stats.

# 1.8.7-1.8.8 - The replays fix

- Fixed an issue where launcher would show white page if it could not find the game in the database
- Used some hacky way to get the game data , this is due to different timezone on the server and the client
- TODO: add GameServerProcessCode to discord embed that collects the stats and then use GameServerProcessCode from replayfile to get the stats from api server

# 1.8.6 - The replays

- Added a new page to the launcher, the replays page. This page will show you all the replays you have saved on your computer.
- When opening a replay you will see stats of that game, you have the option to send this replay file including a screenshot of the stats to our [discord server](https://ptb.discord.com/channels/600425662452465701/1208820966109741056).
  You can use this method to report bugs, or to show off your stats to your friends.
- fix no longer able to ctrl+w to close launcher, or to press alt to get the hidden menu.
- Added translations for the new page
- fix Lint errors
- fix needing patch files to launch the game, this is no longer needed (untill next Christmas)
- Reordered the menu.

# 1.8.5

- Disabled the patching function christmass map is disabled anyway, wont hurt if you do have it
- Changed all proxy servers we now have fi.evos.live, de.evos.live, fr.evos.live, if you do not use launcher you can use this in config file instead of evos-emu.com
- change all accourance of addalyn.baby to evos.live
- change join discord to the public discord page https://evos.live/discord
- invite links are also to the public discord page https://evos.live/discord this can be given to friends and will always work.

# 1.8.4

- fixed some translation issues
- added motd and notifications translations (they work now!)
- Added launcher stats

# 1.8.3

- Bring back the update button

# 1.8.2

- fixed some translation errors
- fixed the black boxes ability previews in the game

# 1.8.1 - Italiano and Brazilian Portuguese

- Fully translated the launcher into Italian and Brazilian Portuguese.
- Added flag icons to the language selection.

# 1.8.0 - The Translation Update

- Fully translated the launcher into Dutch, German, Spanish, French, and Russian.
- Added a new setting to change the launcher language from within the launcher interface.
- If you'd like to contribute by adding another language, please visit [this link](https://ptb.discord.com/channels/600425662452465701/1205619678181990430).

# 1.7.1

- Fixed an issue that patch downloads over and over. even if you already had it.

# 1.7.0

- Make sure that if you download the game true launcher it will make a new folder AtlasReactor (incase they install it directly in "drive:\")
- Add a retry count to the launcher, if it fails to download the game it will retry 3 times before giving up
- updated packages (react, electron, etc)

# 1.6.5

- Fix missing banners (Zheneq)

# 1.6.4 - The Path Update

- Added a warning if Atlas Reactor is installed in a Program Files folder, but not show the warning if its in a steam folder (you may still launch the game tho)
  but if you cant install patches move the game to a difrent location.
  - Warning Locations: C:\Program Files\ar\Win64\AtlasReactor.exe
- fixed typos in Changelog it was late last night

# 1.6.3 - The Logs

- Added a log page to the launcher, this will show you the logs of the game
  you can open the log file, and or open the directory where the log file is located
- Logs are ordered by date, and the latest log is on top
- Logs are formated and color coded, so you can see what is a warning, error, info, debug, etc
- Logs are also color coded by the time of log, so you can see what is recent and what is old, red being recent and green being old
- You wont be able to launch the game if
  - 1: The game is in a OneDrive folder (this corrupts the game)
  - 2: The game is not installed (duh)
  - 3: The game is not installed in correct location, it needs drive:\<games folder>\Win64\AtlasReactor.exe
    - Correct locations: C:\Program Files (x86)\Steam\steamapps\common\Atlas Reactor\Games\Atlas Reactor\Live\Win64\Win64\AtlasReactor.exe
    - Correct locations: D:\Games\AtlasReactor\Win64\AtlasReactor.exe
    - Correct locations: E:\Atlas Reactor\Win64\AtlasReactor.exe
    - Bad locations: E:\Win64\AtlasReactor.exe
    - Bad locations: D:\AtlasReactor.exe
    - Bad locations: C:\Users\<user>\OneDrive\Docments\Atlas Reactor\Win64\AtlasReactor.exe

# 1.6.2 - The Stats Fix

- Bring back stats from previous year
- small change in login page saying change ip with the reset button

# 1.6.1 - The Stats Update

- Added Winrate back to the stats page
- force relogin if api server says your are unothorized for stats page
- when atlas reactor is offline say some functions may be limited with it

# 1.6.0 - The Stats Update

- Added More stats to the player stats page now includes total per freelancer and per map or all maps
- Consolidated Maps to one tab page instead of one per stats type

# 1.5.5

- Added a new proxy server (located Finland)

# 1.5.4 - The Trustwar Update

- Added trustwar in main page
- Added icons on players with trust they stupport
- removed motd and notifications requests from api server for now and use my own to reduce failed requests untill its implemented in the api server
- Removed the grey out effect on Players
- some misc fixes

# 1.5.3

- Fixed still getting warning if you try to close the launcher and game is no longer running

# 1.5.2 - Bugfixes

- Implemented a confirmation dialog when attempting to close the launcher while the game is running.
- Revised the download process once more; aiming to enhance stability for all users.
- only show the notification message on main page. reduce clutter.

# 1.5.1 - Fur-real

- Added Nev:3 to the stats pages

# 1.5.0 - The Bugfix Update

- There was a bug that all chat was not enabled on newly created config files or update it if they did not toggle it on and off, this is now fixed.
- Before launching the game it checks for the 3 files that are needed for the Christmas map, and notify you if they are missing.
- Can no longer spam launch game while patching is going on.
- Added a Join Discord.

# 1.4.6 - The Christmas Update - Disable launching game

- Unable to launch the game if you do not have the Christmas map installed

# 1.4.5 - The Christmas Update - map stats

- Add the Christmas map to the stats pages

# 1.4.4 - The Christmas Update - v3 can thing just work as they should

- Added a setting to disable auto patching if you encounter issues with it.
- because of adding that setting found an other bug that dint set enable all chat correctly.

# 1.4.3 - The Christmas Update - fixed v2

- Using a difrent way to download the files, this should fix the issue (mayby) with the launcher not downloading the files
  Applys for downloading the game and downloading the patch files

# 1.4.2 - The Christmas Update - fixed

- Added an auto patcher, so we can patch the game without having to manualy download the patch files (perks of the laucher),
  this is mostly for christmas map but can be used for other things in the future
- Some fixes to All chat function
- Added a backup notifications and motd message incase main server is down
- Added so we can add something to the launcher that will show up in the launcher in due time :P

# 1.4.1 - The Christmas Update

- Added an auto patcher, so we can patch the game without having to manualy download the patch files (perks of the laucher),
  this is mostly for christmas map but can be used for other things in the future
- Some fixes to All chat function
- Added a backup notifications and motd message incase main server is down
- Added so we can add something to the launcher that will show up in the launcher in due time :P

# 1.4.0 - The Improvements

- Password Reset: You now have the ability to change your password right from the settings menu, ensuring your account security is in your hands.
- Faster Game Downloads: We've optimized our download speeds, making the game installation process twice as fast, so you can get into the action quicker.
- Effortless Updates: Stay up-to-date effortlessly with the new "Update & Launch" button. When there's a new update, simply click the button to install it and auto-launch the launcher (Steamdeck friendly).
- Message of the Day (MOTD): Keep an eye on the top left corner for important announcements and messages with our new MOTD feature.
- Important Notifications: We've added a notification that will alert you to important messages at the top of the page, ensuring you never miss crucial information.

# 1.3.9 - The exe search

- Fixed the all chat option not working, now it realy should work for everyone
- Added an option to search for the game location if you have steam installed and the game is installed on steam
- Optionaly if you downloaded the game true launcher it will automaticly also set the path to the game

# 1.3.8 - The Fix

- Fix for some people that 1.3.7 is not working

# 1.3.7

- Enable all chat in game by default, the only way to disable it is to go to the settings of launcher and disable it over there.
  this is the only setting that i will do like this, all other settings will be in the game itself.

# 1.3.6

- Add meridian to the stats.

# 1.3.5

- Add a second proxy server
- No longer needing to enter the ip adress, but able to select it from a dropdown menu (main, proxy1, proxy2) this in settings and first time setup
- removed port option this will never change anyway
- Added in global stats a new stat of most played gameserver
- Added in previous games type of game , and server played on also option to click the map to point to discord game info
- fixed downloading the game no longer freezes the launcher

# 1.3.4

- Reorder characters and gave them a color based on their role

# 1.3.3

- Now with even more stats
  Add Win Losses and Winrate to the personal stats
  Plus graph with per map stats per month

# 1.3.2

- More stats

# 1.3.1

- Fix Typo
- Fix MVP,Damage,Healing,Tank calculations

# 1.3.0

- Add global stats
- Add Personal/Players stats
- Add Previous matches

# 1.2.7

- Fix splash screen use png instead of webp

# 1.2.6

- Add a splash screen while the app is loading
- Implemented additional checks to minimize the need for users to re-login unnecessarily.

# 1.2.5

- Add a experimantal proxy option in the settings,
  if you are having issues connecting to the lobby server you can try enabling this.
  this will reroute your traffic to a proxy server that will then connect to the lobby server.
  This is not a fix for everyone and is not recommended to use,
  unless you have to.

# 1.2.4

- Allow Capital letters in username
- Add a compatability check for old config files that had lowercase usernames
- Fix the Add account option in the dropdown menu
- Fix deleting acounts and reseting application

# 1.2.3

- Revert just adding -nolog
- Make -nolog a toggle option in the settings. disabled by default.

# 1.2.2

- Small error handling fix

# 1.2.1

- Add form validation to login and register and add account
- Register account now requires a Unique code to sign up, this code is given to you by a Developer
  To get a code you must be in our discord and request access to our testing server in #beta-access
- Add a -nolog in the launching of atlas reactor suposently thats a fix for crashing when you use multiple game instances

# 1.2.0

- Add ability to download said game, this is not the preferred way; use official means first. You must be in our discord and have the correct role in order to use it.
- Fix going to login page if you are still logged in.
- Show in launcher if update is available.

# 1.1.3

- Add ability to kill the game if its launched (able to kill per user launched)
- make errors a bit nicer and say if the server is offline

# 1.1.2

- Add About and Changelog page
- Changelog includes Evos Launcher, Evos (Lobby server) and HC (Game Server) fetching from github
- About page fetches README.md
- Add new image for no character info (When map is in freelancher select or Loadlayout select)
- Renamed some Pages to (Page)Page.tsx
- Tell players not to add a port number or http(s) in the ip field

# 1.1.1

- Alow Registering for account
- Move AddAccount and register to its own page
- Clear unused store items
- Only check for login if they try to login with ticket

# 1.1.0

- Enable tickets! no longer need to create a json file TODO: allow account creation
- Add config so values stay after reopening the app
- moved everything to config
- Fix allot of other things

# 1.0.4

- Add multi user support
- Add ability to specify config per user
- Able to switch between users
- If you previusly logged in now able to quick select username (adds up for each user added)
- removed react-auth-kit using our own way
- allow npm test again since removal of react-auth-kit wich was breaking it
- Some more misc changes

# 1.0.3

- Add Experimental Ticketing system to login to Atlas Reactor server (not fully working yet)

# 1.0.2

- Fix installer

# 1.0.1

- disable arguments for launching the game tickets are not implented yet

# 1.0.0

- Initial version
