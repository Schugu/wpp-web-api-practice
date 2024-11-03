import pkg from 'whatsapp-web.js';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import qrcode from 'qrcode-terminal';

const { Client, RemoteAuth } = pkg;
let client;
let isAuthenticated = false;

export class WppController {
  initializeWhatsAppClient = async () => {
    const store = new MongoStore({ mongoose });

    client = new Client({
      authStrategy: new RemoteAuth({
        store,
        backupSyncIntervalMs: 300000,
      }),
      puppeteer: { headless: true },
    });

    // Evento QR
    client.on('qr', (qr) => {
      console.log('Se necesita autenticación.');
    });

    client.on('remote_session_saved', () => {
      console.log("Sesión guardada en la base de datos.");
    });

    // Eventos de autenticación
    client.on('authenticated', () => {
      console.log('Cliente de WhatsApp autenticado.');
      isAuthenticated = true;
    });

    client.on('ready', () => {
      console.log('Cliente de WhatsApp está listo.');
      isAuthenticated = true;
    });

    client.on('auth_failure', () => {
      console.error('Error de autenticación. Necesita volver a autenticarse.');
      isAuthenticated = false;
    });

    client.on('disconnected', () => {
      console.log('Cliente de WhatsApp desconectado.');
      isAuthenticated = false;
    });

    await client.initialize();
  };

  // Verificar estado de WhatsApp
  checkWhatsAppStatus = (req, res) => {
    if (isAuthenticated) {
      res.status(200).json({ status: 'WhatsApp conectado y listo para usar.' });
    } else {
      res.status(503).json({ status: 'WhatsApp no está autenticado. Requiere inicio de sesión.' });
    }
  }

  // Método para que solo el administrador vea el QR
  adminLogin = (req, res) => {
    if (client && !isAuthenticated) {
      client.once('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        res.status(200).json({ message: 'Escanea el código QR para autenticar.', qr });
      });
    } else if (isAuthenticated) {
      res.status(200).json({ message: 'Ya autenticado y listo para usar.' });
    } else {
      res.status(500).json({ message: 'Error al intentar mostrar QR. Cliente no inicializado.' });
    }
  }

  // Enviar mensaje
  sendMessage = async (req, res) => {
    try {
      if (!isAuthenticated) {
        res.status(503).json({ message: 'El cliente de WhatsApp no está autenticado. Solicita autenticación.' });
        return;
      }

      const { number, message } = req.body;
      if (!number || !message) {
        res.status(400).json({ message: 'Número de teléfono y mensaje son requeridos' });
        return;
      }

      const chatId = `${number}@c.us`;
      await client.sendMessage(chatId, message);
      res.status(200).json({ message: 'Mensaje enviado con éxito' });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      res.status(500).json({ message: 'Error al enviar mensaje', error });
    }
  };
}
