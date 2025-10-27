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
        data: this.serializeData(data),
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private serializeData(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    // ✅ BigInt → string
    if (typeof obj === 'bigint') return obj.toString();

    // ✅ Date → ISO string
    if (obj instanceof Date) return obj.toISOString();

    // ✅ Mảng → đệ quy
    if (Array.isArray(obj)) return obj.map((i) => this.serializeData(i));

    // ✅ Object → đệ quy
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key of Object.keys(obj)) {
        converted[key] = this.serializeData(obj[key]);
      }
      return converted;
    }

    // Các kiểu nguyên thủy khác (string, number, boolean, null, undefined)
    return obj;
  }
}
