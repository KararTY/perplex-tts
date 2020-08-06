import { html, render } from 'uhtml'
// eslint-disable-next-line no-unused-vars
import { ChatClient, PrivmsgMessage, UsernoticeMessage, ClearmsgMessage, ClearchatMessage } from 'dank-twitch-irc'

// This is a "Proof of Concept".

interface Settings {
  channel: string
  prefix: string
  channelPointsId: string
  allow: string[]
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
}

const client = new ChatClient({
  connection: {
    type: 'websocket',
    secure: true
  }
})

function helpHotkey (evt: KeyboardEvent) {
  if ((evt.key === 'z' && evt.ctrlKey) || (evt.key === 'Z' && evt.ctrlKey)) {
    document.getElementById('settings').classList.toggle('is-hidden')
    document.getElementById('messages').classList.toggle('is-hidden')
  }
}
document.addEventListener('keyup', helpHotkey, false)

let synth: SpeechSynthesis
let availableVoices: { default: boolean, lang: string, voice: SpeechSynthesisVoice }[]
let checks = 0
let voicesLoaded = false
function checkForVoices () {
  synth = window.speechSynthesis

  if (synth.getVoices().length === 0) {
    checks++
    if (checks < 100) {
      setTimeout(() => {
        checkForVoices()
      }, 50)
    } else {
      console.error('Not supported.')
    }
    return
  }

  if (!voicesLoaded) {
    availableVoices = synth.getVoices().map((voice, index, arr) => {
      const duplicateLangsBefore = arr.slice(0, index).filter((v) => v.lang === voice.lang).length
      return {
        default: voice.default,
        lang: duplicateLangsBefore > 0 ? `${voice.lang.toLowerCase()}-${duplicateLangsBefore + 1}` : voice.lang.toLowerCase(),
        voice
      }
    }).sort((a, b) => a.lang.localeCompare(b.lang))

    loadSettings()
  }

  voicesLoaded = true
}

setTimeout(() => {
  checkForVoices()
})

let hasClicked = false
render(document.getElementById('enabletts'), html`
  <a class="button is-fullwidth is-danger" onclick="${() => {
    document.getElementById('enabletts').remove()
    hasClicked = true
  }}">Click here to enable TTS!</a>
`)

function renderSettings () {
  render(document.getElementById('settings').querySelector('.card-content'), html`
    <p>Scroll down to save your settings!</p>
    <hr>
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
          <strong>Only works for mods/broadcaster:</strong> <span>Type "!TTS_REWARD" in the channel point reward message, to enable that channel reward to be read as TTS.</span>
        </p>
      </div>
    </div>
    <div class="field">
      <label class="label">Allow</label>
      <div class="control">
        <div class="columns is-multiline is-mobile">
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="*" checked="${currentSettings.allow.includes('*') || undefined}" id="allowanyone" onclick="${onClickAllowAnyone}">
              <span>Anyone</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="vip" checked="${currentSettings.allow.includes('vip') || undefined}" id="allowvip">
              <span>VIP</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="mods" checked="${currentSettings.allow.includes('mods') || undefined}" id="allowmods">
              <span>Mods</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="tierone" checked="${currentSettings.allow.includes('tierone') || undefined}" id="allowtierone">
              <span>Tier 1 Subscribers</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="tiertwo" checked="${currentSettings.allow.includes('tiertwo') || undefined}" id="allowtiertwo">
              <span>Tier 2 Subscribers</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="tierthree" checked="${currentSettings.allow.includes('tierthree') || undefined}" id="allowtierthree">
              <span>Tier 3 Subscribers</span>
            </label>
          </div>
          <div class="column is-narrow">
            <label>
              <input type="checkbox" value="bits" checked="${currentSettings.allow.includes('bits') || undefined}" id="allowbits">
              <span>Bits</span>
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
        <p class="help">If you've allowed bits to be read out, enter the minimum amount of bits to trigger TTS.</p>
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
        <p class="help">Disable certain messages as outlined by <a href="https://help.twitch.tv/s/article/how-to-use-automod">Twitch's Automod</a> feature. <strong>Note: This isn't completely reliable.</strong></p>
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
              document.getElementById('voices').querySelector('.is-success[data-langname]').classList.remove('is-success')

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

  onClickAllowAnyone.bind(document.getElementById('allowanyone'))()
}

function onClickAllowAnyone (this: HTMLInputElement) {
  if (this.checked) {
    document.getElementById('allowvip').parentElement.parentElement.classList.add('is-hidden')
    document.getElementById('allowmods').parentElement.parentElement.classList.add('is-hidden')
    document.getElementById('allowtierone').parentElement.parentElement.classList.add('is-hidden')
    document.getElementById('allowtiertwo').parentElement.parentElement.classList.add('is-hidden')
    document.getElementById('allowtierthree').parentElement.parentElement.classList.add('is-hidden')
    document.getElementById('allowbits').parentElement.parentElement.classList.add('is-hidden')
  } else {
    document.getElementById('allowvip').parentElement.parentElement.classList.remove('is-hidden')
    document.getElementById('allowmods').parentElement.parentElement.classList.remove('is-hidden')
    document.getElementById('allowtierone').parentElement.parentElement.classList.remove('is-hidden')
    document.getElementById('allowtiertwo').parentElement.parentElement.classList.remove('is-hidden')
    document.getElementById('allowtierthree').parentElement.parentElement.classList.remove('is-hidden')
    document.getElementById('allowbits').parentElement.parentElement.classList.remove('is-hidden')
  }
}

let defaultVoiceByLang: SpeechSynthesisVoice
let currentSettings: Settings = {
  channel: '',
  prefix: '',
  channelPointsId: '',
  bits: 0,
  allow: ['*'],
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
const urlParams = new URLSearchParams(window.location.search)
function loadSettings () {
  const savedSettings = localStorage.getItem('perplex-tts.settings')

  try {
    if (savedSettings === null) {
      const lang = urlParams.get('lang') ? decodeURIComponent(urlParams.get('lang')).toLowerCase() : null

      defaultVoiceByLang = typeof lang === 'string'
        ? availableVoices.find((voice) => voice.lang === lang)
          ? availableVoices.find((voice) => voice.lang === lang).voice
          : availableVoices.find((voice) => voice.default).voice
        : availableVoices.find((voice) => voice.default).voice

      const settingsToSave: Settings = {
        channel: urlParams.get('channel') || 'notkarar',
        channelPointsId: '',
        allow: ['*'],
        bits: 0,
        automod: {
          identity: true,
          sexual: true,
          aggressive: true,
          profanity: true
        },
        prefix: typeof urlParams.get('prefix') === 'string' ? `${decodeURIComponent(urlParams.get('prefix'))}` : '!tts',
        cooldown: 10,
        delay: 1,
        wait: 10,
        langName: defaultVoiceByLang.name
      }

      saveSettings(settingsToSave)
    } else {
      // Load settings
      const res = JSON.parse(savedSettings) as Settings
      currentSettings = res
      defaultVoiceByLang = availableVoices.find((voice) => voice.voice.name === currentSettings.langName).voice

      const prom = []

      client.joinedChannels.forEach((channelName) => {
        prom.push(client.part(channelName))
      })

      Promise.all(prom).then(() => [
        client.join(currentSettings.channel)
      ])

      renderSettings()

      const saveButtonHelp = document.getElementById('savebuttonhelp')
      if (saveButtonHelp === null) {
        // renderSettings() will make "savebutton" available.
        document.getElementById('savebutton').parentElement.appendChild(html.node`<p class="help" id="savebuttonhelp">Saved your settings!</p>`)
        setTimeout(() => {
          document.getElementById('savebuttonhelp').remove()
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
      btnEl.parentElement.appendChild(node)
    } else {
      node.setAttribute('class', 'is-size-4 has-text-danger')
      document.getElementById('settings').querySelector('.card-content').prepend(node)
    }
  }
}

function saveSettings (data: MouseEvent | Settings) {
  let settingsToSave: Settings

  if (data instanceof MouseEvent) {
    settingsToSave = {
      channel: (document.getElementById('channel') as HTMLInputElement).value,
      prefix: (document.getElementById('prefix') as HTMLInputElement).value,
      channelPointsId: (document.getElementById('channelpointsid') as HTMLInputElement).value,
      allow: [
        document.getElementById('allowanyone'),
        document.getElementById('allowvip'),
        document.getElementById('allowmods'),
        document.getElementById('allowtierone'),
        document.getElementById('allowtiertwo'),
        document.getElementById('allowtierthree'),
        document.getElementById('allowbits')
      ].filter((checkbox: HTMLInputElement) => checkbox.checked).map((checkbox: HTMLInputElement) => checkbox.value),
      bits: (document.getElementById('bits') as HTMLInputElement).valueAsNumber,
      automod: {
        identity: (document.getElementById('automodidentity') as HTMLInputElement).checked,
        sexual: (document.getElementById('automodsexual') as HTMLInputElement).checked,
        aggressive: (document.getElementById('automodaggressive') as HTMLInputElement).checked,
        profanity: (document.getElementById('automodprofanity') as HTMLInputElement).checked
      },
      cooldown: (document.getElementById('cooldown') as HTMLInputElement).valueAsNumber,
      delay: (document.getElementById('delay') as HTMLInputElement).valueAsNumber,
      wait: (document.getElementById('wait') as HTMLInputElement).valueAsNumber,
      langName: (document.getElementById('voices').querySelector('.is-success[data-langname]') as HTMLAnchorElement).dataset.langname
    }
  } else if (typeof data.channel !== 'undefined') {
    // Save settings
    settingsToSave = data
  }

  localStorage.setItem('perplex-tts.settings', JSON.stringify(settingsToSave))

  loadSettings()
}

let messagesToRead: Message[] = []
let currentDelay: Date = new Date()
function parseMessage (msg: PrivmsgMessage | UsernoticeMessage) {
  const nowDate = new Date()
  if (!msg.messageText.startsWith(currentSettings.prefix) ||
    !voicesLoaded ||
    !hasClicked ||
    currentDelay.getTime() > nowDate.getTime()) {
    return
  }

  try {
    let messageText = msg.messageText.substring(currentSettings.prefix.length)

    // Check "allowed" status.
    let allow = true
    if (!currentSettings.allow.includes('*')) {
      allow = false
      // Is the user a VIP?
      if (currentSettings.allow.includes('vip')) {
        allow = msg.badges.hasVIP
      }

      // Is the user a Mod?
      if (currentSettings.allow.includes('mod')) {
        allow = msg.badges.hasModerator || msg.badgeInfo.hasAdmin || msg.badgeInfo.hasGlobalMod || msg.badgeInfo.hasStaff
      }

      // Is the user a Tier 1 Subscriber?
      if (currentSettings.allow.includes('tierone')) {
        allow = msg.badges.hasSubscriber
      }

      // Is the user a Tier 2 Subscriber?
      if (currentSettings.allow.includes('tiertwo')) {
        allow = msg.badges.hasSubscriber // TODO FIX
      }

      // Is the user a Tier 3 Subscriber?
      if (currentSettings.allow.includes('tierthree')) {
        allow = msg.badges.hasSubscriber // TODO FIX
      }

      // Did the user add bits?
      if (currentSettings.allow.includes('bits')) {
        allow = msg.bits > currentSettings.bits
      }
    }

    // Don't parse message.
    if (!allow) {
      return
    }

    // Check if message is requested through a Channel Point Reward.
    if (currentSettings.channelPointsId.length > 0) {
      // msg.ircTags // TODO FIX
    }

    // Filter bad words.
    if (msg.flags != null) {
      for (let index = 0; index < msg.flags.length; index++) {
        const flag = msg.flags[index]
        let censor = false

        if (currentSettings.automod.identity && !!flag.categories.find((category) => category.category === 'I')) {
          censor = true
        } else if (currentSettings.automod.sexual && !!flag.categories.find((category) => category.category === 'S')) {
          censor = true
        } else if (currentSettings.automod.aggressive && !!flag.categories.find((category) => category.category === 'A')) {
          censor = true
        } else if (currentSettings.automod.profanity && !!flag.categories.find((category) => category.category === 'P')) {
          censor = true
        }

        if (censor) {
          messageText = messageText.replace(new RegExp(String.raw`${flag.word}`), '')
        }
      }
    }

    // Don't try to parse empty messages.
    if (messageText.length < 0) {
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
        waitUntil: new Date(Date.now() + currentSettings.wait * 1000)
      }
    ]

    for (let index = 0; index < words.length; index++) {
      const currentMessagesIndex = messages.length - 1
      const word = words[index]
      const requestsLangRegexp = word.match(/lang:[\w-]+/)
      const requestsRateRegexp = word.match(/rate:[0-2](?:\.[5-9])?/)
      const requestsPitchRegexp = word.match(/pitch:[0-2](?:\.[0-9])?/)

      let voice = messages[currentMessagesIndex].voice
      let rate = messages[currentMessagesIndex].rate
      let pitch = messages[currentMessagesIndex].pitch

      if (requestsLangRegexp !== null) {
        const requestedLangInMsg = requestsLangRegexp[0].split(':').pop()
        const foundLang = availableVoices.find((voice) => voice.lang === requestedLangInMsg.toLowerCase())
        voice = foundLang ? foundLang.voice : defaultVoiceByLang

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
        waitUntil: new Date(Date.now() + currentSettings.wait * 1000)
      })
    }

    // Filter away messages with no text.
    const filteredMessages = messages.filter((message) => message.text.length > 0)

    if (filteredMessages.length > 0) {
      messagesToRead.push(...filteredMessages)
      currentDelay = new Date(Date.now() + (currentSettings.delay * 1000))
      renderMessageQueue()
    }
  } catch (error) {
    console.error(error)
  }
}

function deleteMessage (msg: ClearmsgMessage | ClearchatMessage | { targetMessageID: string }) {
  if (msg instanceof ClearmsgMessage || (!(msg instanceof ClearchatMessage) && msg.targetMessageID)) {
    if (msg.targetMessageID) {
      // Stop &/ Delete message.
      if (typeof currentlySpeaking !== 'undefined' && currentlySpeaking.messageID === msg.targetMessageID) {
        currentlySpeaking = undefined
        synth.cancel()
      }

      messagesToRead = messagesToRead.filter((message) => message.messageID !== msg.targetMessageID)
    }
  } else if (msg instanceof ClearchatMessage) {
    if (msg.targetUsername) {
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

  renderMessageQueue()
}

function addGreenBorder () {
  const div = (document.getElementById('messages').querySelector('.card-content').querySelector('.box') as HTMLDivElement)

  if (div !== null) {
    div.classList.add('currently-reading-message')
  }
}

function removeGreenBorder () {
  const div = (document.getElementById('messages').querySelector('.card-content').querySelector('.box') as HTMLDivElement)

  if (div !== null) {
    div.classList.remove('currently-reading-message')
  }
}

let currentlySpeaking: Message
let killInterval: NodeJS.Timeout
function speakMessage () {
  renderMessageQueue()
  if (messagesToRead.length > 0 && !synth.speaking && Date.now() > messagesToRead[0].waitUntil.getTime()) {
    const message = messagesToRead.shift()

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
          }, currentSettings.cooldown * 1000)
        }
      })

      utterance.addEventListener('error', (ev) => {
        console.error('SpeechSynthesisUtterance.onerror', ev)
      })

      utterance.voice = message.voice
      utterance.pitch = message.pitch
      utterance.rate = message.rate

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
    }, Math.max(typeof messagesToRead[0] !== 'undefined' ? (Date.now() - messagesToRead[0].waitUntil.getTime()) : 0, currentSettings.cooldown * 1000))
  }
}

speakMessage()

function renderMessageQueue () {
  const messagesArr = [currentlySpeaking, ...messagesToRead].filter(Boolean)

  render(document.getElementById('messages').querySelector('.card-content'), html`
    <p>Click on a message to delete it from queue!</p>
    <hr>
    ${messagesArr.length > 0 ? messagesArr.map((message) => html`
      <div class="box" data-messageid="${message.messageID}" onclick="${function clickedOnMessageBox (this: HTMLDivElement) {
        deleteMessage({ targetMessageID: this.dataset.messageid })
      }}">
        <span>By <strong>${message.username}</strong></span>
        <br><span><strong>Text to read out:</strong> ${message.text}</span>
        <br><span><strong>Details:</strong> Pitch:${message.pitch}, Rate:${message.rate}, Synthesizer:${message.voice.name}</span>
      </div>
    `) : undefined}
  `)
}

client.on('372', (msg) => console.log(`Twitch IRC: ${msg.ircParameters.join(' ')}`))
client.on('ready', () => console.log('Successfully connected to Twitch IRC.'))

client.on('PRIVMSG', parseMessage)
client.on('USERNOTICE', parseMessage)

client.on('CLEARMSG', deleteMessage)
client.on('CLEARCHAT', deleteMessage)

client.on('close', (error) => {
  if (error != null) {
    console.error('Client closed due to error', error)
  }

  client.connect()
})

client.connect()
