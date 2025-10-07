import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: this.serializeBigInt(data),
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'bigint') return obj.toString();

    if (Array.isArray(obj)) return obj.map((i) => this.serializeBigInt(i));

    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key of Object.keys(obj)) {
        converted[key] = this.serializeBigInt(obj[key]);
      }
      return converted;
    }

    return obj;
  }
}
