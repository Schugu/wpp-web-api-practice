import mongoose from 'mongoose';

export const connectToMongoDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI; 
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
  }
};
