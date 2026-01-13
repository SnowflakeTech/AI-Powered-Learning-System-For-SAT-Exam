import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix API
  app.setGlobalPrefix('api/v1');

  // Parse form-urlencoded (cho upload + form submit)
  app.use(express.urlencoded({ extended: true }));

  // ✅ Serve static files for uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  // CORS cho Vite FE
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin,
    credentials: true,
  });

  const port = Number(process.env.PORT || 8000);
  await app.listen(port);

  console.log(`BE_FE_DEMO listening on http://localhost:${port}/api/v1`);
  console.log(`Static uploads served at http://localhost:${port}/uploads`);
}

bootstrap();
