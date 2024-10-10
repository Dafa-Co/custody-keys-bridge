import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { TrimPipe } from './libs/transformers/trim.transformer';
import { HttpErrorFilter } from './libs/filters/HttpError.filter';
import { RemoveNullKeysPipe } from './libs/transformers/remove-null-pipe';
import { configs } from './configs/configs';
import { ResponseWrapperInterceptor } from './libs/interceptors/response-wrapper.interceptor';

async function bootstrap() {
  const server = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
  });

  server.useGlobalPipes(new TrimPipe());

  server.setGlobalPrefix('api', {});

  // validation pipes
  server.useGlobalFilters(new HttpErrorFilter());

  server.useGlobalPipes(new RemoveNullKeysPipe());

  server.useGlobalPipes(new TrimPipe());


  const validationOptions: ValidationPipeOptions = {
    whitelist: true,
    stopAtFirstError: true,
    transform: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    enableDebugMessages: true,
  };

  server.useGlobalPipes(
    // here we run the normal validation pipe and when we want to run the transformation after the validation we run the second validation pipe
    new ValidationPipe({
      ...validationOptions
    }),
  );

  server.useGlobalInterceptors(
    new ClassSerializerInterceptor(server.get(Reflector)),
  );

  // Apply the global interceptor
  server.useGlobalInterceptors(new ResponseWrapperInterceptor());


  await server.listen(configs.PORT);
  console.log(`Server is running on: ${await server.getUrl()}`);
}
bootstrap();
