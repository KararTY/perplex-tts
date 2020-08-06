# Perplex TTS
## Browser Twitch TTS.
**EXPERIMENTAL BROWSER SUPPORT:** MAY NOT WORK ON SAFARI OR OPERA.

**Note: Unfortunately this does NOT work in OBS's "Browser Source", as CEF (The Chromium engine) doesn't come with the required speech functionalities.**

### What it does
Plays messages, written in the specified channel with a specific prefix, with a TTS.
[Video showcase.](https://streamable.com/e4q6fp)

### How to try it out
  1. Browse to https://alremahy.com/perplex-tts.html
  2. Change the default values.
  3. Click on save settings.
  4. Click on "Click here to enable TTS!".
  5. Join the provided Twitch channel.
  6. Type a message prefixed by the command prefix, if you left the value as default then type like so `!tts Hello world!`.

### How to use it
  * Adding `lang:xx-xx` before the text will change which language and/or synthesizer it will use.
  * Adding `rate:0.5` to `rate:2` will change how fast it reads a message. Input: Float value from 0.5, 0.6, etc... to a maximum value of 2.
  * Adding `pitch:0` to `pitch:2` will change the pitch of the synthesizer. Input: Float value from 0, 0.1, etc... to a maximum value of 2.

### How to get more TTS voices
  * Install TTS voices via Windows 10 settings:
    <p align="center">
      <img src="./Language_Settings.png"/>
      <br>Make sure they have the "Text-To-Speech" icon that looks like this 👉 <img src="TTS_Icon.png"/> before installing them. <strong>Also, you may be required to restart your PC after installing new languages.</strong>
    </p>
  * Other ways of getting TTS: Not sure. Maybe you know of some?

### How to build it yourself
  1. Make sure you have NodeJS (Latest LTS works).
  2. `npm i` to install modules.
  3. `npm build` to build it.
  4. You can now host the contents of the `/dist` folder wherever you'd like.
  * For testing purposes you can try it out locally with python3:
    * `npm run python3-http-server`

### What it uses
  * [dank-twitch-irc](https://github.com/robotty/dank-twitch-irc) for retrieving Twitch messages.
  * [uHTML](https://github.com/WebReflection/uhtml) for rendering HTML templates.
  * [Bulma](https://github.com/jgthms/bulma) for the styling.
  * [node-sass](https://github.com/sass/node-sass) for stylesheet management.
  * [Parcel 2](https://github.com/parcel-bundler/parcel/) for packing the files for use in the browser.
  * [SpeechSynthesis Browser API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API#Speech_synthesis) for the speech synthesis. No external APIs used here.

### TODO:
  * Allow TTS voices to be renamed.

### Ideas for the future
  * Not requiring the user to click on the big red button to make it work.
  * Make it work in OBS.
