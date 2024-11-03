import pkg from 'whatsapp-web.js';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import dotenv from 'dotenv';
import qrcode from 'qrcode-terminal';

dotenv.config();

const { Client, RemoteAuth } = pkg;

async function initializeWhatsAppClient() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conexión exitosa a MongoDB');

    // Crear el almacén de sesión en MongoDB
    const store = new MongoStore({ mongoose });
    console.log(store);


    // Configurar el cliente de WhatsApp
    const client = new Client({
      authStrategy: new RemoteAuth({
        store,
        backupSyncIntervalMs: 300000 // Hacer respaldo de sesión cada 5 minutos
      }),
      puppeteer: { headless: true } 
    });

    // Manejo de eventos
    client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
      console.log('Escanea el código QR con tu teléfono');
    });

    client.on('authenticated', () => {
      console.log('Evento de autenticación recibido. Esperando guardar la sesión...');
    });

    // TARDA 1 MINUTO EN GUARDAR LA SESSION EN LA BASE DE DATOS
    client.on('remote_session_saved', () => {
      console.log("Sesión guardada en la base de datos.");
    });

    client.on('ready', () => {
      console.log('Cliente de WhatsApp está listo.');
      // console.log(client.info);
    });


    // client.on('message', async (msg) => {
    //   try {
    //     if (msg.from != "status@broadcast") {
    //       const contact = await msg.getContact();
    //       console.log(contact, msg.body);
    //     }
    //   } catch (error) {
    //     console.error(error);
    //   }
    // });


    client.on('auth_failure', (msg) => {
      console.error('Error de autenticación:', msg);
    });

    client.on('disconnected', (reason) => {
      console.log('Cliente desconectado:', reason);
      // console.log('Intentando reconexión...');
    });

    // Inicializar el cliente de WhatsApp
    client.initialize();

  } catch (err) {
    console.error('Error al conectar a MongoDB:', err);
  }
}

// Ejecutar la inicialización del cliente
initializeWhatsAppClient();
