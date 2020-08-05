# Perplex TTS
## Browser Twitch TTS.
**EXPERIMENTAL BROWSER SUPPORT:** MAY NOT WORK ON SAFARI OR OPERA.

**Note: Unfortunately this does NOT work in OBS's "Browser Source", as CEF (The Chromium engine) doesn't come with the required speech functionalities.**

### What it does
Plays messages, written in the specified channel with a specific prefix, with a TTS.
[Video showcase.](https://streamable.com/e4q6fp)

### How to try it out
  1. Browse to https://alremahy.com/perplex-tts.html?channel=notkarar&prefix=!tts&lang=en-us
  2. Join the [NotKarar](https://www.twitch.tv/notkarar) Twitch channel.
  3. Type a message prefixed by `!tts `, like so `!tts Hello world!`.

By changing the `?channel=<channel_name_goes_here>` part of the url, you connect to the specified streamer's chat.

Changing the `&prefix=<prefix_goes_here>` part of the url will let you decide what to use as the prefix.

Changing the `&lang=<locale-goes-here>` part of the url will let you decide the default language / speech synthesizer for messages.

You can get a list of supported languages by your browser by pressing `CTRL+Z`, in the website, on your keyboard.

That's pretty much it.

### What it uses
  * [dank-twitch-irc](https://github.com/robotty/dank-twitch-irc) for retrieving Twitch messages.
  * [Parcel 2](https://github.com/parcel-bundler/parcel/) for packing the files for use in the browser.
  * [SpeechSynthesis Browser API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API#Speech_synthesis) for the speech synthesis. No external APIs used here.

### How to build it yourself
  1. Make sure you have NodeJS (Latest LTS works).
  2. `npm i` to install modules.
  3. `npm build` to build it.
  4. You can now host the contents of the `/dist` folder wherever you'd like.
  * For testing purposes you can try it out locally with python3:
    * `npm run python3-http-server`

### Ideas for the future
  * Not requiring the user to click on the big button to make it work.
  * Enable / Disable AutoMod filter (IDENTITY, AGGRESSIVE, SEXUAL, PROFANITY).
  * Make it work in OBS.
