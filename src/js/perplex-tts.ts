// eslint-disable-next-line no-unused-vars
import { ChatClient, PrivmsgMessage, UsernoticeMessage, ClearmsgMessage, ClearchatMessage } from 'dank-twitch-irc'

// This is a "Proof of Concept".

const urlParams = new URLSearchParams(window.location.search)

const channel = urlParams.get('channel') || 'notkarar'
const commandPrefix = typeof urlParams.get('prefix') === 'string' ? `${decodeURIComponent(urlParams.get('prefix'))}` : '!tts'
const requestedLang: string | null = urlParams.get('lang') ? decodeURIComponent(urlParams.get('lang')).toLowerCase() : null

let hasClicked = false
document.querySelector('button').onclick = () => {
  document.querySelector('button').remove()
  hasClicked = true
}

let synth: SpeechSynthesis
let availableVoices: { default: boolean, lang: string, voice: SpeechSynthesisVoice }[]
let defaultVoiceByLang: SpeechSynthesisVoice

let voicesLoaded = false
let checks = 0
setTimeout(() => {
  checkForVoices()
})

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
      const duplicateLangsBefore = arr.slice(0, index).filter(v => voice.lang === v.lang).length
      return {
        default: voice.default,
        lang: duplicateLangsBefore > 0 ? `${voice.lang.toLowerCase()}-${duplicateLangsBefore + 1}` : voice.lang.toLowerCase(),
        voice
      }
    }).sort((a, b) => a.lang.localeCompare(b.lang))

    defaultVoiceByLang = typeof requestedLang === 'string'
      ? availableVoices.find(voice => voice.lang === requestedLang)
        ? availableVoices.find(voice => voice.lang === requestedLang).voice
        : availableVoices.find(voice => voice.default).voice
      : availableVoices.find(voice => voice.default).voice
  }

  voicesLoaded = true
}

document.addEventListener('keyup', helpHotkey, false)

function helpHotkey (evt: KeyboardEvent) {
  if ((evt.key === 'z' && evt.ctrlKey) || (evt.key === 'Z' && evt.ctrlKey)) {
    if (voicesLoaded) {
      const pDiv = document.getElementById('help')
      if (pDiv) {
        pDiv.remove()
      } else {
        const p = document.createElement('p')
        p.id = 'help'
        p.style.margin = 'auto'
        p.style.padding = '1rem'
        p.innerHTML = `Current channel: ${channel}`
        p.innerHTML += `<hr>Current prefix: ${commandPrefix}`
        p.innerHTML += `<hr>Current lang: [${defaultVoiceByLang.name}]`
        p.innerHTML += '<hr>Available lang options: (Line in bold is current lang)'
        p.innerHTML += `<br>${availableVoices.map(voice => `${defaultVoiceByLang.name === voice.voice.name ? `<strong>- Currently in use: ${voice.lang} [${voice.voice.name}]</strong>` : `${voice.lang} [${voice.voice.name}]`}`).join('<br>')}`
        document.body.appendChild(p)
      }
    }
  }
}

interface Message {
  messageID: string
  userID: string
  text: string
  voice: SpeechSynthesisVoice
  rate: number
  pitch: number
}

let messagesToRead: Message[] = []
let currentlySpeaking: Message

const client = new ChatClient({
  connection: {
    type: 'websocket',
    secure: true
  }
})

client.on('372', msg => console.log(`Twitch IRC: ${msg.ircParameters.join(' ')}`))

client.on('ready', () => console.log('Successfully connected to Twitch IRC.'))

client.on('close', error => {
  if (error != null) {
    console.error('Client closed due to error', error)
  }
})

client.on('PRIVMSG', displayMessage)
client.on('USERNOTICE', displayMessage)

function displayMessage (msg: PrivmsgMessage | UsernoticeMessage) {
  if (!msg.messageText.startsWith(commandPrefix) || !voicesLoaded || !hasClicked) {
    return
  }

  try {
    let messageText = msg.messageText.substring(commandPrefix.length)

    // Filter bad words.
    if (msg.flags != null) {
      for (let index = 0; index < msg.flags.length; index++) {
        const word = msg.flags[index].word
        messageText = messageText.replace(new RegExp(String.raw`${word}`), '')
      }
    }

    const words = messageText.split(' ')

    // Split message into messages if there are more voices requested in the tts.
    const messages: Message[] = [
      {
        messageID: msg.messageID,
        userID: msg.senderUserID,
        text: '',
        voice: defaultVoiceByLang,
        rate: 1,
        pitch: 1
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
        const foundLang = availableVoices.find(voice => voice.lang === requestedLangInMsg.toLowerCase())
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
        text: '',
        voice,
        rate,
        pitch
      })
    }

    messagesToRead.push(...messages)
  } catch (error) {
    console.error(error)
  }
}

client.on('CLEARMSG', deleteMessage)
client.on('CLEARCHAT', deleteMessage)

function deleteMessage (msg: ClearmsgMessage | ClearchatMessage) {
  if (msg instanceof ClearmsgMessage) {
    if (msg.targetMessageID) {
      // Stop &/ Delete message.
      if (currentlySpeaking.messageID === msg.targetMessageID) {
        synth.cancel()
      }

      messagesToRead = messagesToRead.filter(message => message.messageID !== msg.targetMessageID)
    }
  } else if (msg instanceof ClearchatMessage) {
    if (msg.targetUsername) {
      // Stop &/ Delete all messages by user.
      if (currentlySpeaking.userID === msg.targetUsername) {
        synth.cancel()
      }

      messagesToRead = messagesToRead.filter(message => message.userID !== msg.targetUsername)
    } else {
      synth.cancel()
      messagesToRead = []
    }
  }
}

function parseMessages () {
  if (messagesToRead.length > 0 && !synth.speaking) {
    const message = messagesToRead.shift()

    if (message.text.length > 0) {
      const utterance = new SpeechSynthesisUtterance(message.text)

      currentlySpeaking = message

      utterance.addEventListener('end', (ev) => {
        console.log('SpeechSynthesisUtterance.onend', ev)
        // ev.elapsedTime
      })

      utterance.addEventListener('error', (ev) => {
        console.error('SpeechSynthesisUtterance.onerror', ev)
      })

      utterance.voice = message.voice
      utterance.pitch = message.pitch
      utterance.rate = message.rate

      synth.speak(utterance)
    }
  }

  setTimeout(() => {
    parseMessages()
  })
}

parseMessages()

client.connect()

client.join(channel)
