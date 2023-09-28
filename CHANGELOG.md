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
