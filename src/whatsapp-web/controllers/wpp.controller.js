
export class WppController {
  constructor({ wppModel }) {
    this.wppModel = wppModel;
  }

  initClient = async (req, res) => {
    const { number } = req.params;

    try {
      await this.wppModel.initClient(parseInt(number), res);
    } catch (error) {
      console.error(`Error al inicializar el cliente de WhatsApp para el número ${clientNumber}:`, error);
      return res.status(500).json({ message: 'Error al inicializar el cliente de WhatsApp', error });
    }
  };

  checkStatus = async (req, res) => {
    try {
      const { number } = req.params;

      const result = await this.wppModel.checkStatus(parseInt(number));

      return res.status(200).json({ number: `${number}`, status: `${result.status}` });
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




  sendMessage = async (req, res) => {
    const { number, recipient, message } = req.body;

    try {
      const result = await this.wppModel.sendMessage({ number, recipient, message });

      if (!result) {
        return res.status(503).json({ message: `Error al cerrar la sesión del número: ${number}.` });
      }

      if (result.noClient) {
        return res.status(500).json({ message: `Cliente no inicializado para el número ${number}.` });
      }

      if (result.noAuth) {
        return res.status(503).json({ message: 'Cliente no autenticado. Solicita autenticación.' });
      }

      return res.status(200).json({ message: 'Mensaje enviado con éxito' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al enviar mensaje.' });
    }
  };


}