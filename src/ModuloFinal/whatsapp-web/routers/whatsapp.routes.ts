import { Router } from 'express'

import { WppController } from '../controllers/whatsapp.controller'

export const createWppRouter = () => {
  const wppRouter = Router()

  const wppController = new WppController()

  wppRouter.get('/login/:number', wppController.initClient)
  wppRouter.get('/status/:number', wppController.checkStatus)
  wppRouter.get('/logout/:number', wppController.logout)
  wppRouter.post('/send-message', wppController.sendMessage)
  wppRouter.get('/chats/:number', wppController.getChats)
  wppRouter.post('/chats/:number', wppController.getChat)
  wppRouter.post('/chats/:number/messages', wppController.getMessages)
  wppRouter.post('/chats/:number/archiveChat', wppController.archiveChat)
  wppRouter.post('/chats/:number/profilePhoto', wppController.getProfilePhoto)

  return wppRouter
}
