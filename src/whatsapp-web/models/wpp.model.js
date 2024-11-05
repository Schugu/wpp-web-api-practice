import pkg from 'whatsapp-web.js';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import qrcode from 'qrcode-terminal';
import { WhatsAppSession } from './WhatsAppSession.js';

const { Client, RemoteAuth } = pkg;

export class WppModel {
  constructor() {
    this.clients = new Map(); // Almacena las instancias de clientes por número
    this.isAuthenticated = new Map(); // Almacena el estado de autenticación de cada número
  }

  initClient = async (number) => {
    const store = new MongoStore({ mongoose });

    const client = new Client({
      authStrategy: new RemoteAuth({
        store,
        backupSyncIntervalMs: 300000,
        clientId: number, // Usa el número como identificador del cliente
      }),
      qrMaxRetries: 5,
      puppeteer: { headless: true },
    });

    // Guardar el cliente en el objeto `clients`
    this.clients.set(number, client);

    // Eventos de autenticación y mensajes
    client.on('qr', (qr) => {
      console.log(`Código QR para ${number}. Escanéalo para autenticar.`);
      qrcode.generate(qr, { small: true });
    });


    client.on('remote_session_saved', async () => {
      console.log(`Sesión guardada en la base de datos para el número: ${number}.`);
    
      // Asegúrate de que `number` es un valor válido antes de guardar
      if (number !== null && number !== undefined) {
        const sessionData = client.authState;
        await WhatsAppSession.findOneAndUpdate(
          { clientId: number },
          { $set: { sessionData } },
          { upsert: true }
        );
      } else {
        console.error("Número inválido (null o undefined), no se puede guardar la sesión.");
      }
    });

    client.on('authenticated', () => {
      console.log(`Cliente de WhatsApp autenticado para el número: ${number}.`);
      this.isAuthenticated.set(number, true); // Marca al cliente como autenticado
    });

    client.on('ready', () => {
      console.log(`Cliente de WhatsApp listo para el número: ${number}.`);
    });

    client.on('auth_failure', () => {
      console.error(`Error de autenticación para el número: ${number}.`);
      this.isAuthenticated.set(number, false); // Marca al cliente como no autenticado
    });

    client.on('disconnected', () => {
      console.log(`Cliente de WhatsApp desconectado para el número: ${number}.`);
      this.clients.delete(number); // Remueve el cliente desconectado
      this.isAuthenticated.delete(number); // Remueve el estado de autenticación
    });

    await client.initialize();
  };

  // // Inicializar todas las sesiones guardadas
  // restoreSessions = async () => {
  //   const sessions = await WhatsAppSession.find({});

  //   if (sessions.length === 0) {
  //     console.warn('No se encontraron sesiones para restaurar.');
  //     return;
  //   };

  //   for (const session of sessions) {
  //     const { clientId } = session; 
  //     try {
  //       await this.initClient(clientId);
  //     } catch (clientError) {
  //       console.error(`Error al inicializar el cliente para el ID ${clientId}:`, clientError.message);
  //     }
  //   }

  //   console.log('Todas las sesiones restauradas');
  // };



  restoreSessions = async () => {
    const sessions = await WhatsAppSession.find({});
    
    if (sessions.length === 0) {
      console.warn('No se encontraron sesiones para restaurar.');
    };

    for (const session of sessions) {
      const { clientId } = session; // Obtén el identificador único (en este caso, el número)
      try {
        await this.initClient(clientId); // Inicializa el cliente para cada número
        console.log(`Sesión con el id: ${clientId} restaurada.`);
      } catch (clientError) {
        console.error(`Error al inicializar el cliente para el ID ${clientId}:`, clientError.message);
      }
    }
  };

  checkStatus= async (number) => {
    if (this.isAuthenticated.get(number)) {
      return true;
    } else {
      return false;
    }
  }






















  // adminLogin = (req, res) => {
  //   const { number } = req.params;
  //   const client = this.clients.get(number);

  //   if (client && !this.isAuthenticated.get(number)) {
  //     client.once('qr', (qr) => {
  //       qrcode.generate(qr, { small: true });
  //       res.status(200).json({ message: `Escanea el código QR para autenticar ${number}.`, qr });
  //     });
  //   } else if (this.isAuthenticated.get(number)) {
  //     res.status(200).json({ message: `Número ${number} ya autenticado.` });
  //   } else {
  //     res.status(500).json({ message: `Cliente no inicializado para el número ${number}.` });
  //   }
  // }

  // sendMessage = async (req, res) => {
  //   const { number, recipient, message } = req.body;
  //   const client = this.clients.get(number);

  //   if (!client) {
  //     res.status(500).json({ message: `Cliente no inicializado para el número ${number}.` });
  //     return;
  //   }

  //   if (!this.isAuthenticated.get(number)) {
  //     res.status(503).json({ message: 'Cliente no autenticado. Solicita autenticación.' });
  //     return;
  //   }

  //   try {
  //     const chatId = `${recipient}@c.us`;
  //     await client.sendMessage(chatId, message);
  //     res.status(200).json({ message: 'Mensaje enviado con éxito' });
  //   } catch (error) {
  //     console.error('Error al enviar mensaje:', error);
  //     res.status(500).json({ message: 'Error al enviar mensaje', error });
  //   }
  // };
}
