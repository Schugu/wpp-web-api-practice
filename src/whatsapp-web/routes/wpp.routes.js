import { Router } from 'express';

import { WppController } from "../controllers/wpp.controller.js";
import { validateSchema } from "../../middlewares/validateSchema.js";
import { validateParamsSchema } from "../../middlewares/validateParamsSchema.js";
import { phoneNumberSchema } from "../../schemas/wpp.schema.js";

export const createWppRouter = () => {
  const wppRouter = Router();

  const wppController = new WppController();

  wppRouter.post('/whatsapp/init/:number', validateParamsSchema(phoneNumberSchema), wppController.initClient);
  wppRouter.get('/whatsapp/status/:number', validateParamsSchema(phoneNumberSchema), wppController.checkStatus);
  // wppRouter.post('/whatsapp/auth/:number', validateParamsSchema(phoneNumberSchema), wppController.adminLogin);
  // wppRouter.post('/whatsapp/send', wppController.sendMessage);

  return wppRouter;
}