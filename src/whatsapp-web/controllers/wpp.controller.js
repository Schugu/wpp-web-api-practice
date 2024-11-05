import { WppModel } from "../models/wpp.model.js";

export class WppController {
  constructor() {
    this.wppModel = new WppModel();
  }

  initClient = async (req, res) => {
    const { number } = req.params;
    const clientNumber = parseInt(number); // Convertir a entero
  
    if (isNaN(clientNumber)) {
      console.error("Número inválido, no se puede inicializar el cliente.");
      return res.status(400).json({ message: "Número inválido" });
    }
    
    try {
      await this.wppModel.initClient(clientNumber); // Pasar clientNumber
    } catch (error) {
      console.error(`Error al inicializar el cliente de WhatsApp para el número ${clientNumber}:`, error);
      return res.status(500).json({ message: 'Error al inicializar el cliente de WhatsApp', error });
    }
  };

  checkStatus = async (req, res) => {
    try {
      const { number } = req.params;
      const parsedNumber = parseInt(number);
  
      if (isNaN(parsedNumber)) {
        return res.status(400).json({ message: 'Número inválido.' });
      }
  
      const result = await this.wppModel.checkStatus(parsedNumber);
  
      if (!result) {
        return res.status(503).json({ status: `WhatsApp no está autenticado para ${number}.` });
      }
  
      return res.status(200).json({ status: `WhatsApp para ${number} está autenticado y listo para usar.` });
    } catch (error) {
      console.error(error); // Verifica el error en la consola
      return res.status(500).json({ message: 'Error al verificar el estado de WhatsApp.' });
    }
  };




  // adminLogin = async (req, res) => {
  //   await wppModel.adminLogin(req, res);
  // };

  // sendMessage = async (req, res) => {
  //   await wppModel.sendMessage(req, res);
  // };


}