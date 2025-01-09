import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  sessionData: { type: Object },
});

export const WhatsAppSession = mongoose.model('WhatsAppSession', sessionSchema);
