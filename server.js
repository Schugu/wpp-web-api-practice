import { createApp } from './src/app.js';

createApp().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
});
