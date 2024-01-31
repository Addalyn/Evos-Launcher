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
