import { wppModel } from '../config/wppModelInstance'
import { Request, Response } from 'express'

export class WppController {
  wppModel: typeof wppModel

  constructor() {
    this.wppModel = wppModel
  }

  initClient = async (req: Request, res: any) => {
    const { number } = req.params

    try {
      await this.wppModel.initClient(number, res)
    } catch (error) {
      console.error(`Error al inicializar el cliente de WhatsApp para el número ${number}:`, error)
      return res.status(500).json({ message: 'Error al inicializar el cliente de WhatsApp', error })
    }
  }

  checkStatus = async (req: Request, res: Response) => {
    try {
      const { number } = req.params

      const result = await this.wppModel.checkStatus(number)

      return res.status(200).json({ number: `${number}`, status: `${result.status}` })
    } catch (error) {
      console.error(error) // Verifica el error en la consola
      return res.status(500).json({ message: 'Error al verificar el estado de WhatsApp.' })
    }
  }

  getChats = async (req: Request, res: Response) => {
    try {
      const { number } = req.params

      const result = await this.wppModel.getChats(number)

      if (!result) {
        return res.status(400).json({ message: 'Error al acceder a los chats.' })
      }

      return res.status(200).json({ result })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Error.' })
    }
  }

  getChat = async (req: Request, res: Response) => {
    try {
      const { number } = req.params
      const { recipient } = req.body

      const result = await this.wppModel.getChat(number, recipient)

      if (!result) {
        return res.status(400).json({ message: 'Error al acceder al chat.' })
      }

      return res.status(200).json({ result })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Error.' })
    }
  }

  getMessages = async (req: Request, res: Response) => {
    try {
      const { number } = req.params
      const { recipient } = req.body

      const result = await this.wppModel.getMessages(number, recipient)

      if (!result) {
        return res.status(400).json({ message: 'Error al acceder a los mensajes.' })
      }

      return res.status(200).json({ result })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Error.' })
    }
  }

  logout = async (req: Request, res: Response) => {
    try {
      const { number } = req.params

      const result = await this.wppModel.logout(number)

      if (!result) {
        return res.status(503).json({ message: `Error al cerrar la sesión del número: ${number}.` })
      }

      return res.status(200).json({ status: `Sesión de WhatsApp del número: ${number} cerrada.` })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Error al cerrar sesión.' })
    }
  }

  sendMessage = async (req: Request, res: Response) => {
    const { number, recipient, message } = req.body

    try {
      const result = await this.wppModel.sendMessage(number, recipient, message)

      if (!result) {
        return res.status(503).json({ message: `Error al cerrar la sesión del número: ${number}.` })
      }

      if (result.noClient) {
        return res
          .status(500)
          .json({ message: `Cliente no inicializado para el número ${number}.` })
      }

      if (result.noAuth) {
        return res.status(503).json({ message: 'Cliente no autenticado. Solicita autenticación.' })
      }

      return res.status(200).json({ message: 'Mensaje enviado con éxito' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Error al enviar mensaje.' })
    }
  }

  archiveChat = async (req: Request, res: Response) => {
    const { number } = req.params
    const { recipient } = req.body

    if (!number || !recipient) {
      return res.status(400).json({ error: "Se requieren los campos 'number' y 'recipient'." })
    }

    try {
      const result = await this.wppModel.archiveChat(number, recipient)

      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

      if (result.message === 'El chat ya estaba archivado.') {
        return res.status(200).json({ message: 'El chat ya estaba archivado.' })
      }

      res.status(200).json({ message: 'Chat archivado correctamente.' })
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
  }

  getProfilePhoto = async (req: Request, res: Response) => {
    const { number } = req.params
    const { recipient } = req.body

    if (!number || !recipient) {
      return res.status(400).json({ error: "Se requieren los campos 'number' y 'recipient'." })
    }

    try {
      const result = await this.wppModel.getProfilePhoto(number, recipient)

      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

      res.status(200).json({ result })
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor.' })
    }
  }
}
