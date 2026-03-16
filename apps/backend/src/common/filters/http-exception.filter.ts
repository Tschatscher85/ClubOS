import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

// Deutsche Fehlermeldungen fuer Standard-HTTP-Statuscodes
const DEUTSCHE_FEHLERMELDUNGEN: Record<number, string> = {
  400: 'Ungueltige Anfrage',
  401: 'Nicht authentifiziert',
  403: 'Zugriff verweigert',
  404: 'Nicht gefunden',
  409: 'Konflikt',
  422: 'Validierungsfehler',
  429: 'Zu viele Anfragen',
  500: 'Interner Serverfehler',
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let nachricht: string;
    let details: unknown = undefined;

    if (typeof exceptionResponse === 'string') {
      nachricht = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as Record<string, unknown>;
      nachricht = (resp.message as string) || '';
      if (Array.isArray(resp.message)) {
        nachricht =
          DEUTSCHE_FEHLERMELDUNGEN[status] || 'Fehler bei der Verarbeitung';
        details = resp.message;
      }
    } else {
      nachricht =
        DEUTSCHE_FEHLERMELDUNGEN[status] || 'Fehler bei der Verarbeitung';
    }

    response.status(status).json({
      erfolg: false,
      statusCode: status,
      nachricht,
      details,
      zeitstempel: new Date().toISOString(),
    });
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Keine internen Details in der Antwort loggen
    console.error('Unbehandelter Fehler:', exception);

    response.status(status).json({
      erfolg: false,
      statusCode: status,
      nachricht: DEUTSCHE_FEHLERMELDUNGEN[500],
      zeitstempel: new Date().toISOString(),
    });
  }
}
