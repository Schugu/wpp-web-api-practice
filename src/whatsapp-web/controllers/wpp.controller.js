import { WppModel } from "../models/wpp.model.js";

export class WppController {
  constructor({wppModel}) {
    this.wppModel = wppModel;
  }

  initClient = async (req, res) => {
    const { number } = req.params;
    
    try {
      await this.wppModel.initClient(parseInt(number));
    } catch (error) {
      console.error(`Error al inicializar el cliente de WhatsApp para el número ${clientNumber}:`, error);
      return res.status(500).json({ message: 'Error al inicializar el cliente de WhatsApp', error });
    }
  };

  checkStatus = async (req, res) => {
    try {
      const { number } = req.params;

      const result = await this.wppModel.checkStatus(parseInt(number));
  
      if (!result) {
        return res.status(503).json({ status: `WhatsApp no está autenticado para ${number}.` });
      }
  
      return res.status(200).json({ status: `WhatsApp para ${number} está autenticado y listo para usar.` });
    } catch (error) {
      console.error(error); // Verifica el error en la consola
      return res.status(500).json({ message: 'Error al verificar el estado de WhatsApp.' });
    }
  };

  logout = async (req, res) => {
    try {
      const { number } = req.params;

      const result = await this.wppModel.logout(parseInt(number));
  
      if (!result) {
        return res.status(503).json({ message: `Error al cerrar la sesión del número: ${number}.` });
      }
  
      return res.status(200).json({ status: `Sesión de WhatsApp del número: ${number} cerrada.` });
    } catch (error) {
      console.error(error); 
      return res.status(500).json({ message: 'Error al cerrar sesión.' });
    }
  };




  // adminLogin = async (req, res) => {
  //   await wppModel.adminLogin(req, res);
  // };

  // sendMessage = async (req, res) => {
  //   await wppModel.sendMessage(req, res);
  // };


}