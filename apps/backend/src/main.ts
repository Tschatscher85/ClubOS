import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS aktivieren
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Globale Validation-Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Globale Exception-Filter
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Swagger API-Dokumentation
  const config = new DocumentBuilder()
    .setTitle('ClubOS API')
    .setDescription('API fuer die ClubOS Multi-Tenant SaaS-Plattform fuer Sportvereine')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`ClubOS Backend laeuft auf Port ${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/docs`);
}

bootstrap();
