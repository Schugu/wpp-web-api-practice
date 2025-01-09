import pkg from 'whatsapp-web.js'
import mongoose from 'mongoose'
import { MongoStore } from 'wwebjs-mongo'
import qrcode from 'qrcode-terminal'
import { WhatsAppSession } from '../config/whatsApp.model'
import { getSocket } from '../../config/socketConfig'

const { Client, RemoteAuth } = pkg

export class WppModel {
  clients: Map<string, any>
  isAuthenticated: Map<string, boolean>
  constructor() {
    this.clients = new Map()
    this.isAuthenticated = new Map()
  }

  initClient = async (number: string) => {
    const store = new MongoStore({ mongoose })

    const io = getSocket()

    const client = new Client({
      authStrategy: new RemoteAuth({
        store,
        backupSyncIntervalMs: 300000,
        clientId: number,
      }),
      qrMaxRetries: 3,
      puppeteer: { headless: true },
    })

    // Guardar el cliente en el objeto `clients`
    this.clients.set(number, client)

    client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true })
      io.emit('qr init', { qr })
    })

    client.on('remote_session_saved', async () => {
      console.log(`Sesión guardada en la base de datos para el número: ${number}.`)

      const sessionData = {}

      try {
        await WhatsAppSession.findOneAndUpdate(
          { clientId: number },
          { $set: { sessionData } },
          { upsert: true }
        )
      } catch (error) {
        console.log('Error al guardar la sessión en la base de datos.')
      }
    })

    client.on('authenticated', () => {
      console.log(`Cliente de WhatsApp autenticado para el número: ${number}.`)
      this.isAuthenticated.set(number, true)
    })

    client.on('message', (message) => {
      console.log(`Nuevo mensaje de ${message.from}: ${message.body}`)
      const formattedMessage = {
        from: message.from,
        body: message.body,
        to: message.to,
        timestamp: message.timestamp,
      }
      io.emit('chat message', formattedMessage)
    })

    client.on('ready', () => {
      console.log(`Cliente de WhatsApp listo para el número: ${number}.`)
    })

    client.on('auth_failure', () => {
      console.error(`Error de autenticación para el número: ${number}.`)
      this.isAuthenticated.set(number, false)
    })

    client.on('disconnected', async () => {
      console.log(`Cliente de WhatsApp desconectado para el número: ${number}.`)

      try {
        await client.destroy()
        console.log(`Cliente de WhatsApp destruido para el número: ${number}.`)
      } catch (error) {
        console.error(`Error al destruir el cliente de WhatsApp para el número ${number}:`, error)
      }

      this.clients.delete(number)
      this.isAuthenticated.delete(number)

      try {
        await WhatsAppSession.deleteOne({ clientId: number })
        console.log(`Sesión eliminada de la base de datos para el número: ${number}.`)
      } catch (error) {
        console.error(
          `Error al eliminar la sesión de la base de datos para el número ${number}:`,
          error
        )
      }
    })

    await client.initialize()
  }

  restoreSessions = async () => {
    const sessions = await WhatsAppSession.find({})

    if (sessions.length === 0) {
      // Return ????
      console.log('No se encontraron sesiones para restaurar.')
    }

    for (const session of sessions) {
      const { clientId } = session
      try {
        await this.initClient(clientId)
        console.log(`Sesión con el id: ${clientId} restaurada.`)
      } catch (error) {
        console.error(`Error al inicializar el cliente para el ID ${clientId}:`, error)
      }
    }
  }

  checkStatus = async (number: string) => {
    const client = this.clients.get(number)

    if (!client) {
      return { status: 'DISCONNECT' }
    }

    const status = await client.getState()

    return { status }
  }

  getChats = async (number: string, socket: any) => {
    const client = this.clients.get(number)

    if (!client) {
      return { error: 'Cliente no inicializado.' }
    }

    try {
      const chats = await client.getChats()

      if (!chats) {
        return { error: 'No se encontraron chats.' }
      }

      // Obtener fotos de perfil de manera asíncrona
      const chatsWithPhotos = await Promise.all(
        chats.map(async (chat: any) => {
          const profilePhoto = await client.getProfilePicUrl(chat.id._serialized).catch(() => null)
          return {
            ...chat,
            profilePhoto: profilePhoto || null, // Agregar la foto de perfil o null si no está disponible
          }
        })
      )

      socket.emit('chats', chatsWithPhotos)
    } catch (error) {
      console.error('Error al obtener los chats:', error)
      socket.emit('chats', error)
    }
  }

  getChat = async (number: string, recipient: string, socket: any) => {
    const client = this.clients.get(number)

    if (!client) {
      return
    }

    const chat = await client.getChatById(recipient + '@c.us')

    if (!chat) {
      return
    }

    socket.emit('chat', chat)
  }

  getMessages = async (number: string, recipient: string, socket: any) => {
    const client = this.clients.get(number)

    if (!client) {
      return
    }

    // Determina si el recipient es un usuario o un grupo
    const chatId = recipient.includes('-') ? recipient + '@g.us' : recipient + '@c.us'

    const chat = await client.getChatById(chatId)

    if (!chat) {
      return
    }

    const messages = await chat.fetchMessages({ limit: 100 }) // Límite de mensajes

    const formattedMessages = messages.map((message: any) => ({
      from: message.from === number + '@c.us' ? 'me' : message.from,
      body: message.body,
      timestamp: message.timestamp,
    }))

    socket.emit('messages', formattedMessages)
  }

  logout = async (num: string) => {
    console.log(num)
    const client = this.clients.get(num)

    if (!client) {
      console.error(`Cliente no inicializado para el número ${num}.`)
      return false
    }

    try {
      await client.logout()
      await client.destroy()
      this.clients.delete(num)
      this.isAuthenticated.delete(num)

      await WhatsAppSession.deleteOne({ clientId: num })
      console.log(`Sesión de WhatsApp eliminada para el número: ${num}.`)

      return true
    } catch (error) {
      console.error(`Error al cerrar la sesión para el número ${num}:`, error)
      return false
    }
  }

  sendMessage = async (number: string, recipient: string, message: string, socket: any) => {
    const client = this.clients.get(number)

    try {
      if (!client) {
        throw Error(`cliente no iniciado para el numero ${number}`)
      }

      if (!this.isAuthenticated.get(number)) {
        throw Error(`cliente no aunteticado. Solicita autenticación`)
      }

      const chatId = `${recipient}@c.us`
      await client.sendMessage(chatId, message)
      socket.emit('messageStatus', { status: true })
    } catch (error: any) {
      socket.emit('messageStatus', { status: false, error: error.message })
      console.error('Error al enviar mensaje:', error)
    }
  }

  archiveChat = async (number: string, recipient: string) => {
    const client = this.clients.get(number)

    if (!client) {
      return { error: 'Cliente no inicializado.' }
    }

    try {
      const chatId = recipient.includes('-') ? `${recipient}@g.us` : `${recipient}@c.us`

      const chat = await client.getChatById(chatId)

      if (!chat) {
        return { error: 'Chat no encontrado.' }
      }

      if (chat.archived) {
        return { success: true, message: 'El chat ya estaba archivado.' }
      }

      const result = await client.archiveChat(chatId)

      if (result) {
        return { success: true, message: 'Chat archivado correctamente.' }
      } else {
        return { error: 'No se pudo archivar el chat.' }
      }
    } catch (error) {
      return { error: 'Error al archivar el chat.' }
    }
  }

  getProfilePhoto = async (number: string, recipient: string) => {
    const client = this.clients.get(number)

    if (!client) {
      return { error: 'Cliente no inicializado.' }
    }

    try {
      const chatId = recipient.includes('-') ? `${recipient}@g.us` : `${recipient}@c.us`

      const chat = await client.getChatById(chatId)

      if (!chat) {
        return { error: 'Chat no encontrado.' }
      }

      const result = await client.getProfilePicUrl(chatId)

      if (result) {
        return { success: true, ProfilePicUrl: result }
      } else {
        return { error: 'No se pudo obtener la foto de perfil.' }
      }
    } catch (error) {
      return { error: 'Error al obtener la foto de perfil.' }
    }
  }
}
