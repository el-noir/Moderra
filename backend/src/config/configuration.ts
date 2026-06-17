function parseJwtExpiresIn(value: string): number {
  if (value.endsWith('d')) {
    return Number(value.slice(0, -1)) * 60 * 60 * 24;
  }

  if (value.endsWith('h')) {
    return Number(value.slice(0, -1)) * 60 * 60;
  }

  return Number(value);
}

export default () => ({
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  jwtExpiresInSeconds: parseJwtExpiresIn(process.env.JWT_EXPIRES_IN ?? '1d'),
  port: Number(process.env.PORT ?? 3001),
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'AdminPass1',
  groqApiKey: process.env.GROQ_API_KEY,
  groqVisionModel: process.env.GROQ_VISION_MODEL,
});
