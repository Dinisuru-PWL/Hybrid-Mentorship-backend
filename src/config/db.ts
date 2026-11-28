import mongoose from 'mongoose';

let dbConnected = false;

export function isDbConnected(): boolean {
  return dbConnected && mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devcraft';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    dbConnected = true;
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    dbConnected = false;
    console.warn(
      'MongoDB not reachable — running in in-memory fallback mode until MongoDB is started.',
      error instanceof Error ? error.message : '',
    );
    return false;
  }
}
