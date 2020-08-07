import { html, render } from 'uhtml'
import { ChatClient, PrivmsgMessage, UsernoticeMessage, ClearmsgMessage, ClearchatMessage } from 'dank-twitch-irc'

// This is a "Proof of Concept".

interface Settings {
  volume: number
  channel: string
  prefix: string
  channelPointsId: string
  allow: AllowTypes[]
  bits: number
  automod: {
    identity: boolean
    sexual: boolean
    aggressive: boolean
    profanity: boolean
  }
  cooldown: number
  delay: number
  wait: number
  langName: string
}

interface Message {
  messageID: string
  userID: string
  username: string
  text: string
  voice: SpeechSynthesisVoice
  rate: number
  pitch: number
  startedAt: Date
  sameMessage: boolean
  waitUntil: Date
  volume: number
}

interface AvailableVoices {
  default: boolean
  lang: string
  voice: SpeechSynthesisVoice
}

enum AllowTypes {
  ANYONE = 'anyone',
  TIERONE = 'tierone',
  VIPS = 'vips',
  MODS = 'mods'
}

const TTSREWARDMSG = '!TTS_REWARD'

function helpHotkey (evt: KeyboardEvent): void {
  if ((evt.key === 'z' && evt.ctrlKey) || (evt.key === 'Z' && evt.ctrlKey)) {
    (document.getElementById('settings') as HTMLDivElement).classList.toggle('is-hidden')
    ;(document.getElementById('messages') as HTMLDivElement).classList.toggle('is-hidden')
  }
}
document.addEventListener('keyup', helpHotkey, false)

let synth: SpeechSynthesis
let availableVoices: AvailableVoices[]
let checks = 0
let voicesLoaded = false
function checkForVoices (): void {
  synth = window.speechSynthesis

  if (synth.getVoices().length === 0) {
    checks++
    if (checks < 100) {
      setTimeout(() => {
        checkForVoices()
      }, 50)
    } else {
      const node = html.node`
        <p class="help is-danger" id="savebuttonhelp">
          <span>There's been an error loading / saving your settings! Check the console logs for more information.</span>
          <span>If you think it's a bug, report it on <a href="https://www.github.com/kararty/perplex-tts">Github</a>!</span>
        </p>
      `
      node.setAttribute('class', 'is-size-4 has-text-danger')
      ;((document.getElementById('settings') as HTMLDivElement).querySelector('.card-content') as HTMLDivElement).prepend(node)
    }
    return
  }

  if (!voicesLoaded) {
    availableVoices = synth.getVoices().sort(a => (a.lang === 'en-GB' && a.name.startsWith('Microsoft')) ? -1 : 1).sort(x => x.default ? -1 : 1).map((voice, index, arr) => {
      const duplicateLangsBefore = arr.slice(0, index).filter((v) => v.lang === voice.lang).length
      return {
        default: index === 0,
        lang: duplicateLangsBefore > 0 ? `${voice.lang.toLowerCase()}-${duplicateLangsBefore + 1}` : voice.lang.toLowerCase(),
        voice
      }
    }).sort((a, b) => a.lang.localeCompare(b.lang))
  }

  voicesLoaded = true
}

setTimeout(() => {
  checkForVoices()
})

let hasClicked = false
render(document.getElementById('enabletts') as HTMLDivElement, html`
  <a class="button is-fullwidth is-danger" onclick="${() => {
    (document.getElementById('enabletts') as HTMLDivElement).remove()
    hasClicked = true
  }}">Click here to enable TTS!</a>
`)

function renderSettings (): void {
  render(((document.getElementById('settings') as HTMLDivElement).querySelector('.card-content') as HTMLDivElement), html`
    <p>Scroll down to save your settings!</p>
    <hr>
    <div class="field">
      <label class="label">Volume</label>
      <div class="control">
        <input class="slider is-fullwidth" type="range" min="0" step="0.01" max="1" value=${currentSettings.volume} id="volume" onchange="${function onChangeVolumeSlider (this: HTMLInputElement) {
          (this.parentElement as HTMLDivElement).title = this.value
        }}">
        <p class="help">Default volume for TTS. Messages may only define lower values, and never higher than the one set above.</p>
      </div>
    </div>
    <div class="field">
      <label class="label">Twitch channel</label>
      <div class="control">
        <input class="input" type="text" value=${currentSettings.channel} id="channel">
        <p class="help">Enter Twitch channel to join.</p>
      </div>
    </div>
    <div class="field">
      <label class="label">Prefix</label>
      <div class="control">
        <input class="input" type="text" value=${currentSettings.prefix} id="prefix">
        <p class="help">Prefix for messages. Can be left empty.</p>
      </div>
    </div>
    <div class="field">
      <label class="label">Channel points Reward ID</label>
      <div class="control">
        <input class="input" type="text" value=${currentSettings.channelPointsId} id="channelpointsid">
        <p class="help">
          <span>If your channel has points enabled, you can play TTS on a specified reward.</span>
          <strong>Only works for mods/broadcaster:</strong> <span>Type "${TTSREWARDMSG}" in the channel point reward message, to enable that channel reward to be read as TTS.</span>
        </p>
      </div>
    </div>
    <div class="field">
      <label class="label">Allow</label>
      <div class="control">
        <div class="columns is-multiline is-mobile">
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="${AllowTypes.ANYONE}" checked="${currentSettings.allow.includes(AllowTypes.ANYONE) || undefined}" id="${'allow' + AllowTypes.ANYONE}" onclick="${onClickAllowAnyone}">
              <span>Anyone</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="${AllowTypes.VIPS}" checked="${currentSettings.allow.includes(AllowTypes.VIPS) || undefined}" id="${'allow' + AllowTypes.VIPS}">
              <span>VIP</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="${AllowTypes.MODS}" checked="${currentSettings.allow.includes(AllowTypes.MODS) || undefined}" id="${'allow' + AllowTypes.MODS}">
              <span>Mods</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="${AllowTypes.TIERONE}" checked="${currentSettings.allow.includes(AllowTypes.TIERONE) || undefined}" id="${'allow' + AllowTypes.TIERONE}">
              <span>Subscribers</span>
            </label>
          </div>
        </div>
      </div>
      <p class="help">A checked "Anyone" will allow anyone to trigger the TTS. Uncheck "Anyone" to enable TTS under certain criterias.</p>
    </div>
    <div class="field">
      <label class="label">Bits</label>
      <div class="control">
        <input class="input" type="number" min="0" value=${currentSettings.bits} id="bits">
        <p class="help">If you set the value above 0, this will enable TTS on bits if the minimum amount of bits is cheered.</p>
      </div>
    </div>
    <div class="field">
      <label class="label">Automod</label>
      <div class="control">
        <div class="columns is-multiline is-mobile">
          <div class="column is-narrow">
            <label>
              <input type="checkbox" checked="${currentSettings.automod.identity || undefined}" id="automodidentity">
              <span>Identity</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" checked="${currentSettings.automod.sexual || undefined}" id="automodsexual">
              <span>Sexual</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" checked="${currentSettings.automod.aggressive || undefined}" id="automodaggressive">
              <span>Aggressive</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" checked="${currentSettings.automod.profanity || undefined}" id="automodprofanity">
              <span>Profanity</span>
            </label>
          </div>
        </div>
        <p class="help">Censor words as outlined by <a href="https://help.twitch.tv/s/article/how-to-use-automod">Twitch's Automod</a> feature. <strong>Note: This isn't completely reliable.</strong></p>
      </div>
    </div>
    <div class="field">
      <label class="label">Waiting period</label>
      <div class="control">
        <input class="input" type="number" min="0" value=${currentSettings.wait} id="wait">
        <p class="help">How long to wait in seconds before allowing a message to be read out. <strong>Note: This will override "cooldown" if "cooldown" is shorter.</strong></p>
      </div>
    </div>
    <div class="field">
      <label class="label">Cooldown</label>
      <div class="control">
        <input class="input" type="number" min="0" value=${currentSettings.cooldown} id="cooldown">
        <p class="help">The cooldown in seconds between each message being read out. <strong>Note: This may be overriden by the "waiting period" value if "waiting period" is longer.</strong></p>
      </div>
    </div>
    <div class="field">
      <label class="label">Ignore delay</label>
      <div class="control">
        <input class="input" type="number" min="0" value=${currentSettings.delay}id="delay">
        <p class="help">Ignores incoming messages, in seconds, if they come in too fast.</p>
      </div>
    </div>
    <div class="field">
      <label class="label">Available TTS languages/synthesizers</label>
      <div class="control">
        <div class="tags" id="voices">
          ${availableVoices.map((voice) => html`
            <a class="${(currentSettings.langName === voice.voice.name ? 'is-success ' : '') + 'tag'}" data-langname="${voice.voice.name}" onclick="${function clickedLang (this: HTMLAnchorElement) {
              ((document.getElementById('voices') as HTMLDivElement).querySelector('.is-success[data-langname]') as HTMLDivElement).classList.remove('is-success')

              this.classList.add('is-success')
            }}"><span><strong>${voice.lang}</strong></span> <span>[${voice.voice.name}]</span></a>
          `)}
        </div>
        <p class="help">Click on one to enable it as the default TTS language/synthesizer.</p>
      </div>
    </div>
    <div class="field">
      <div class="control">
        <a class="button is-success" onclick="${saveSettings}" id="savebutton">Save settings</a>
      </div>
    </div>
  `)

  onClickAllowAnyone.bind(document.getElementById('allowanyone') as HTMLInputElement)()
}

function onClickAllowAnyone (this: HTMLInputElement): void {
  if (this.checked) {
    (((document.getElementById('allow' + AllowTypes.VIPS) as HTMLInputElement).parentElement as Element).parentElement as Element).classList.add('is-hidden')
    ;(((document.getElementById('allow' + AllowTypes.MODS) as HTMLInputElement).parentElement as Element).parentElement as Element).classList.add('is-hidden')
    ;(((document.getElementById('allow' + AllowTypes.TIERONE) as HTMLInputElement).parentElement as Element).parentElement as Element).classList.add('is-hidden')
  } else {
    (((document.getElementById('allow' + AllowTypes.VIPS) as HTMLInputElement).parentElement as Element).parentElement as Element).classList.remove('is-hidden')
    ;(((document.getElementById('allow' + AllowTypes.MODS) as HTMLInputElement).parentElement as Element).parentElement as Element).classList.remove('is-hidden')
    ;(((document.getElementById('allow' + AllowTypes.TIERONE) as HTMLInputElement).parentElement as Element).parentElement as Element).classList.remove('is-hidden')
  }
}

let defaultVoiceByLang: SpeechSynthesisVoice
let currentSettings: Settings = {
  volume: 1,
  channel: '',
  prefix: '',
  channelPointsId: '',
  bits: 0,
  allow: [AllowTypes.ANYONE],
  automod: {
    identity: true,
    sexual: true,
    aggressive: true,
    profanity: true
  },
  cooldown: 10,
  wait: 10,
  delay: 1,
  langName: ''
}
function loadSettings (): void {
  const savedSettings = localStorage.getItem('perplex-tts.settings')

  try {
    if (savedSettings === null) {
      defaultVoiceByLang = (availableVoices.find((voice) => voice.default) as AvailableVoices).voice

      const defaultSettings: Settings = {
        volume: 1,
        channel: 'notkarar',
        channelPointsId: '',
        allow: [AllowTypes.ANYONE],
        bits: 0,
        automod: {
          identity: true,
          sexual: true,
          aggressive: true,
          profanity: true
        },
        prefix: '!tts',
        cooldown: 10,
        delay: 1,
        wait: 10,
        langName: defaultVoiceByLang.name
      }

      saveSettings(defaultSettings)
    } else {
      // Load settings
      const res = JSON.parse(savedSettings) as Settings
      currentSettings = res
      defaultVoiceByLang = (availableVoices.find((voice) => voice.voice.name === currentSettings.langName) as AvailableVoices).voice

      const prom: Array<Promise<any>> = []

      if (typeof client !== 'undefined') {
        client.joinedChannels.forEach((channelName) => {
          console.log(`Disconnecting from Twitch channel ${channelName}...`)
          if (typeof client !== 'undefined') {
            prom.push(client.part(channelName))
          }
        })

        Promise.all(prom).then(() => {
          if (typeof client !== 'undefined') {
            client.join(currentSettings.channel)
              .then(() => console.log('Joined Twitch channel', currentSettings.channel))
              .catch(console.error)
          }
        }).catch(console.error)
      }

      renderSettings()

      const saveButtonHelp = document.getElementById('savebuttonhelp')
      if (saveButtonHelp === null) {
        // renderSettings() will make "savebutton" available.
        ((document.getElementById('savebutton') as HTMLButtonElement).parentElement as Element).appendChild(html.node`<p class="help" id="savebuttonhelp">Saved your settings!</p>`)
        setTimeout(() => {
          const helpParagraph = document.getElementById('savebuttonhelp')
          if (helpParagraph !== null) {
            helpParagraph.remove()
          }
        }, 3000)
      }
    }
  } catch (error) {
    console.error(error)
    const btnEl = document.getElementById('savebutton')
    const node = html.node`
      <p class="help is-danger" id="savebuttonhelp">
        <span>There's been an error loading / saving your settings! Check the console logs for more information.</span>
        <span>If you think it's a bug, report it on <a href="https://www.github.com/kararty/perplex-tts">Github</a>!</span>
      </p>
    `
    if (btnEl !== null) {
      (btnEl.parentElement as Element).appendChild(node)
    } else {
      node.setAttribute('class', 'is-size-4 has-text-danger')
      ;((document.getElementById('settings') as HTMLDivElement).querySelector('.card-content') as HTMLDivElement).prepend(node)
    }
  }
}

function saveSettings (data: MouseEvent | Settings): void {
  let settingsToSave: Settings | undefined

  if (data instanceof MouseEvent) {
    const bits = (document.getElementById('bits') as HTMLInputElement).valueAsNumber
    const vol = (document.getElementById('volume') as HTMLInputElement).valueAsNumber
    const cooldown = (document.getElementById('cooldown') as HTMLInputElement).valueAsNumber
    const delay = (document.getElementById('delay') as HTMLInputElement).valueAsNumber
    const wait = (document.getElementById('wait') as HTMLInputElement).valueAsNumber
    const channel = (document.getElementById('channel') as HTMLInputElement).value

    settingsToSave = {
      volume: isNaN(vol) ? 0 : vol,
      cooldown: isNaN(cooldown) ? 0 : cooldown,
      delay: isNaN(delay) ? 0 : delay,
      wait: isNaN(wait) ? 0 : wait,
      bits: isNaN(bits) ? 0 : bits,
      channel: channel.length === 0 ? 'notkarar' : channel,
      prefix: (document.getElementById('prefix') as HTMLInputElement).value,
      channelPointsId: (document.getElementById('channelpointsid') as HTMLInputElement).value,
      allow: [
        document.getElementById('allow' + AllowTypes.ANYONE) as HTMLInputElement,
        document.getElementById('allow' + AllowTypes.VIPS) as HTMLInputElement,
        document.getElementById('allow' + AllowTypes.MODS) as HTMLInputElement,
        document.getElementById('allow' + AllowTypes.TIERONE) as HTMLInputElement
      ].filter((checkbox: HTMLInputElement) => checkbox.checked).map((checkbox: HTMLInputElement) => checkbox.value as AllowTypes),
      automod: {
        identity: (document.getElementById('automodidentity') as HTMLInputElement).checked,
        sexual: (document.getElementById('automodsexual') as HTMLInputElement).checked,
        aggressive: (document.getElementById('automodaggressive') as HTMLInputElement).checked,
        profanity: (document.getElementById('automodprofanity') as HTMLInputElement).checked
      },
      langName: ((document.getElementById('voices') as HTMLInputElement).querySelector('.is-success[data-langname]') as HTMLAnchorElement).dataset.langname as string
    }
  } else if (typeof data.channel !== 'undefined') {
    // Save settings
    settingsToSave = data
  }

  if (typeof settingsToSave !== 'undefined') {
    localStorage.setItem('perplex-tts.settings', JSON.stringify(settingsToSave))
  }

  loadSettings()
}

let messagesToRead: Message[] = []
let currentDelay: Date = new Date()
function parseMessage (msg: PrivmsgMessage | UsernoticeMessage): void {
  try {
    if (msg.messageText === TTSREWARDMSG && (msg.isMod || msg.badges.hasBroadcaster) && msg.ircTags['custom-reward-id'] != null) {
      currentSettings.channelPointsId = msg.ircTags['custom-reward-id']
      saveSettings(currentSettings)
      return
    }

    const nowDate = new Date()
    if (!voicesLoaded || !hasClicked || currentDelay.getTime() > nowDate.getTime()) {
      return
    }

    let messageText = msg.messageText as string

    // Logic to see if message should be read out.
    let allow = true

    if (!currentSettings.allow.includes(AllowTypes.ANYONE)) {
      allow = false
      for (let index = 0; index < currentSettings.allow.length; index++) {
        const allowedEl = currentSettings.allow[index]
        if (allowedEl === AllowTypes.VIPS) {
          allow = msg.badges.hasVIP
          break
        } else if (allowedEl === AllowTypes.MODS) {
          allow = msg.badges.hasBroadcaster || msg.badges.hasModerator || msg.badgeInfo.hasAdmin || msg.badgeInfo.hasGlobalMod || msg.badgeInfo.hasStaff
          break
        } else if (allowedEl === AllowTypes.TIERONE) {
          allow = msg.badges.hasSubscriber
        }
      }
    }

    /**
     * If the above checks returned true, then check if message has a prefix.
     * Messages do not need the prefix if bits or channel points id is enabled.
     */
    allow = (allow && messageText.startsWith(currentSettings.prefix))

    // If all checks returned false, then check if the user added bits?
    const bits = typeof msg.bits === 'number' ? msg.bits : 0
    if (!allow && currentSettings.bits > 0 && bits > 0) {
      allow = bits >= currentSettings.bits
    }

    // Check if message is requested through a Channel Point Reward.
    if (currentSettings.channelPointsId.length > 0 && typeof msg.ircTags['custom-reward-id'] !== 'undefined') {
      if (currentSettings.channelPointsId === msg.ircTags['custom-reward-id']) {
        allow = true
      }
    }

    // Don't parse the message.
    if (!allow) {
      return
    }

    if (messageText.startsWith(currentSettings.prefix)) {
      messageText = messageText.substring(currentSettings.prefix.length)
    }

    // Filter bad words.
    if (msg.flags instanceof Array) {
      for (let index = 0; index < msg.flags.length; index++) {
        const flag = msg.flags[index]
        let censor = false

        if (currentSettings.automod.identity && typeof flag.categories.find((category) => category.category === 'I') !== 'undefined') {
          censor = true
        } else if (currentSettings.automod.sexual && typeof flag.categories.find((category) => category.category === 'S') !== 'undefined') {
          censor = true
        } else if (currentSettings.automod.aggressive && typeof flag.categories.find((category) => category.category === 'A') !== 'undefined') {
          censor = true
        } else if (currentSettings.automod.profanity && typeof flag.categories.find((category) => category.category === 'P') !== 'undefined') {
          censor = true
        }

        if (censor) {
          messageText = messageText.replace(new RegExp(String.raw`${flag.word}`), '')
        }
      }
    }

    // Don't try to parse empty messages.
    if (messageText.trim().length === 0) {
      return
    }

    const words = messageText.split(' ')

    // Split message into messages if there are more voices requested in the tts.
    const messages: Message[] = [
      {
        messageID: msg.messageID,
        userID: msg.senderUserID,
        username: msg.senderUsername,
        text: '',
        voice: defaultVoiceByLang,
        rate: 1,
        pitch: 1,
        startedAt: new Date(),
        sameMessage: false,
        waitUntil: new Date(Date.now() + currentSettings.wait * 1000),
        volume: currentSettings.volume
      }
    ]

    for (let index = 0; index < words.length; index++) {
      const currentMessagesIndex = messages.length - 1
      const word = words[index]
      const requestsLangRegexp = word.match(/lang:[\w-]+/)
      const requestsRateRegexp = word.match(/rate:[0-2](?:\.[5-9])?/)
      const requestsPitchRegexp = word.match(/pitch:[0-2](?:\.[0-9])?/)
      const requestsVolumeRegexp = word.match(/volume:[0-1](?:\.[0-9])?/)

      let voice = messages[currentMessagesIndex].voice
      let rate = messages[currentMessagesIndex].rate
      let pitch = messages[currentMessagesIndex].pitch
      let volume = messages[currentMessagesIndex].volume

      if (requestsLangRegexp !== null) {
        const requestedLangInMsg = requestsLangRegexp[0].split(':').pop() as string
        const foundLang = availableVoices.find((voice) => voice.lang === requestedLangInMsg.toLowerCase())
        voice = typeof foundLang !== 'undefined' ? foundLang.voice : defaultVoiceByLang

        if (messages[currentMessagesIndex].text.length === 0) {
          messages[currentMessagesIndex].voice = voice
          continue
        }
      } else if (requestsRateRegexp !== null) {
        const number = Number(requestsRateRegexp[0].split(':').pop())
        rate = number < 0.5 ? 0.5 : number > 2 ? 2 : number

        if (messages[currentMessagesIndex].text.length === 0) {
          messages[currentMessagesIndex].rate = rate
          continue
        }
      } else if (requestsPitchRegexp !== null) {
        const number = Number(requestsPitchRegexp[0].split(':').pop())
        pitch = number < 0 ? 0 : number > 2 ? 2 : number

        if (messages[currentMessagesIndex].text.length === 0) {
          messages[currentMessagesIndex].pitch = pitch
          continue
        }
      } else if (requestsVolumeRegexp !== null) {
        const number = Number(requestsVolumeRegexp[0].split(':').pop())
        volume = currentSettings.volume > 0
          ? (number <= 0.01 ? 0.01 : number > currentSettings.volume ? currentSettings.volume : number)
          : 0

        if (messages[currentMessagesIndex].text.length === 0) {
          messages[currentMessagesIndex].volume = volume
          continue
        }
      } else {
        messages[currentMessagesIndex].text += ` ${word}`
        messages[currentMessagesIndex].text = messages[currentMessagesIndex].text.trim()
        continue
      }

      messages.push({
        messageID: msg.messageID,
        userID: msg.senderUserID,
        username: msg.senderUsername,
        text: '',
        voice,
        rate,
        pitch,
        startedAt: new Date(),
        sameMessage: true,
        waitUntil: new Date(Date.now() + currentSettings.wait * 1000),
        volume
      })
    }

    // Filter away messages with no text.
    const filteredMessages = messages.filter((message) => message.text.length > 0)

    if (filteredMessages.length > 0) {
      messagesToRead.push(...filteredMessages)
      currentDelay = new Date(Date.now() + (currentSettings.delay * 1000))
    }
  } catch (error) {
    console.error(error)
  }
}

function deleteMessage (msg: ClearmsgMessage | ClearchatMessage | { targetMessageID: string }): void {
  if (msg instanceof ClearmsgMessage || (!(msg instanceof ClearchatMessage) && typeof msg.targetMessageID === 'string')) {
    if (typeof msg.targetMessageID === 'string') {
      // Stop &/ Delete message.
      if (typeof currentlySpeaking !== 'undefined' && currentlySpeaking.messageID === msg.targetMessageID) {
        currentlySpeaking = undefined
        synth.cancel()
      }

      messagesToRead = messagesToRead.filter((message) => message.messageID !== msg.targetMessageID)
    }
  } else if (msg instanceof ClearchatMessage) {
    if (typeof msg.targetUsername !== 'undefined') {
      // Stop &/ Delete all messages by user.
      if (typeof currentlySpeaking !== 'undefined' && currentlySpeaking.userID === msg.targetUsername) {
        currentlySpeaking = undefined
        synth.cancel()
      }

      messagesToRead = messagesToRead.filter((message) => message.userID !== msg.targetUsername)
    } else {
      currentlySpeaking = undefined
      synth.cancel()
      messagesToRead = []
    }
  }
}

function addGreenBorder (): void {
  const div = (((document.getElementById('messages') as HTMLDivElement).querySelector('.card-content') as HTMLDivElement).querySelector('.box') as HTMLDivElement)

  if (div !== null) {
    div.classList.add('currently-reading-message')
  }
}

function removeGreenBorder (): void {
  const div = (((document.getElementById('messages') as HTMLDivElement).querySelector('.card-content') as HTMLDivElement).querySelector('.box') as HTMLDivElement)

  if (div !== null) {
    div.classList.remove('currently-reading-message')
  }
}

function calculateNextSpeakSpeechDate (): Date {
  let waitDate = new Date()
  let cooldownDate = new Date(Date.now() + currentSettings.cooldown * 1000)

  if (typeof cooldownDate === 'undefined' || (Date.now() > cooldownDate.getTime())) {
    cooldownDate = new Date(Date.now() + currentSettings.cooldown * 1000)
  }

  if (typeof messagesToRead[0] !== 'undefined') {
    waitDate = messagesToRead[0].waitUntil
  }

  return waitDate.getTime() > cooldownDate.getTime() ? waitDate : cooldownDate
}

let currentlySpeaking: Message | undefined
let killInterval: NodeJS.Timeout
let nextSpeechDate: Date
function speakMessage (): void {
  if (messagesToRead.length > 0 && !synth.speaking && Date.now() > messagesToRead[0].waitUntil.getTime()) {
    const message = messagesToRead.shift() as Message

    if (message.text.length > 0) {
      const utterance = new SpeechSynthesisUtterance(message.text)

      currentlySpeaking = message

      utterance.addEventListener('end', (ev) => {
        console.log('SpeechSynthesisUtterance.onend', ev)
        removeGreenBorder()
        currentlySpeaking = undefined
        // ev.elapsedTime
        if (messagesToRead.length > 0 && messagesToRead[0].sameMessage) {
          setTimeout(() => {
            speakMessage()
          })
        } else {
          setTimeout(() => {
            speakMessage()
          }, (() => {
            nextSpeechDate = calculateNextSpeakSpeechDate()
            return nextSpeechDate.getTime() - Date.now()
          })())
        }
      })

      utterance.addEventListener('error', (ev) => {
        console.error('SpeechSynthesisUtterance.onerror', ev)
      })

      utterance.voice = message.voice
      utterance.pitch = message.pitch
      utterance.rate = message.rate
      utterance.volume = message.volume

      currentlySpeaking.startedAt = new Date()
      synth.speak(utterance)
      addGreenBorder()

      if (typeof killInterval !== 'undefined') {
        clearInterval(killInterval)
      }

      killInterval = setInterval(() => {
        if (typeof currentlySpeaking === 'undefined') {
          clearInterval(killInterval)
          return
        }

        if ((Date.now() - currentlySpeaking.startedAt.getTime()) > 30000) {
          clearInterval(killInterval)
          synth.cancel()
        }
      }, 1000)
    } else {
      setTimeout(() => {
        speakMessage()
      })
    }
  } else {
    setTimeout(() => {
      speakMessage()
    }, (() => {
      nextSpeechDate = calculateNextSpeakSpeechDate()
      return nextSpeechDate.getTime() - Date.now()
    })())
  }
}

speakMessage()

function displayNextSpeakSpeechTime (): number {
  return nextSpeechDate.getTime() - Date.now()
}

function renderMessageQueue (): void {
  const messagesArr = [currentlySpeaking, ...messagesToRead].filter(Boolean) as Message[]

  render((document.getElementById('messages') as HTMLDivElement).querySelector('.card-content') as HTMLDivElement, html`
    <p><span>Click on a message to delete it from queue!</span>
      <br><span>${typeof currentlySpeaking === 'undefined' && messagesToRead.length === 0
        ? 'Waiting for more messages...'
        : displayNextSpeakSpeechTime() < 0.1
          ? `TTS elapsed time, ~${(Math.abs(displayNextSpeakSpeechTime()) / 1000).toFixed(2)} seconds...`
          : `Next message in ~${(displayNextSpeakSpeechTime() / 1000).toFixed(2)} seconds...`}<span>
    </p>
    <hr>
    ${messagesArr.length > 0 ? messagesArr.map((message) => html`
      <div class="box" data-messageid="${message.messageID}" onclick="${function clickedOnMessageBox (this: HTMLDivElement) {
        deleteMessage({ targetMessageID: this.dataset.messageid as string })
      }}">
        <span>By <strong>${message.username}</strong></span>
        <br><span><strong>Text to read out:</strong> ${message.text}</span>
        <br><span><strong>Details:</strong> Volume: ${message.volume}, Pitch: ${message.pitch}, Rate: ${message.rate}, Synthesizer: ${message.voice.name}</span>
      </div>
    `) : undefined}
  `)
}

setInterval(() => renderMessageQueue())

let killClientCounter: number = 0
let client: ChatClient | undefined
function addEventListeners (): void {
  killClientCounter = 0
  if (typeof client !== 'undefined') {
    client.removeAllListeners()
    client = undefined
  }

  client = new ChatClient({
    connection: {
      type: 'websocket',
      secure: true
    }
  })

  client.on('372', (msg) => console.log(`Twitch IRC: ${msg.ircParameters.join(' ')}`))
  client.on('ready', () => {
    console.log('Successfully connected to Twitch IRC.')
    loadSettings()
  })

  client.on('PRIVMSG', parseMessage)
  client.on('USERNOTICE', parseMessage)

  client.on('CLEARMSG', deleteMessage)
  client.on('CLEARCHAT', deleteMessage)

  client.on('error', (error) => {
    if (error != null) {
      console.error('Client error', error)
    }
  })

  client.connect()
}

setInterval(() => {
  if (typeof client !== 'undefined') {
    if (client.joinedChannels.size === 0) {
      killClientCounter++

      if (killClientCounter > 4) {
        render(((document.getElementById('settings') as HTMLDivElement).querySelector('.card-content') as HTMLDivElement), html`
          <p>Attempting to reconnect to Twitch chat in ${10 - killClientCounter} seconds...</p>
        `)
      }

      if (killClientCounter > 9) {
        // Attempt reconnection.
        addEventListeners()
      }
    }
  } else {
    addEventListeners()
  }
}, 1000)
