import { Router } from 'express';

import { WppController } from "../controllers/wpp.controller.js";


export const createWppRouter = () => {
  const wppRouter = Router();

  const wppController = new WppController();


  wppRouter.get('/status', wppController.checkWhatsAppStatus);
  wppRouter.get('/qr', wppController.adminLogin);
  wppRouter.post('/send-message', wppController.sendMessage);

  return wppRouter;
}