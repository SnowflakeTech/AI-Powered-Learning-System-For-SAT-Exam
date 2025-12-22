import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  
  app.use(express.urlencoded({ extended: true }));

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }),
  );

  // CORS cho Vite
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({ origin, credentials: true });

  const port = Number(process.env.PORT || 8000);
  await app.listen(port);
  console.log(`BE_FE_DEMO listening on http://localhost:${port}/api/v1`);
}
bootstrap();
