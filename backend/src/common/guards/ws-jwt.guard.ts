import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsAuthService } from '@/common/services/ws/ws-auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private wsAuthService: WsAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    
    const user = await this.wsAuthService.authenticateSocket(client);
    
    if (!user) {
      client.disconnect();
      return false;
    }

    client.data.user = user;
    return true;
  }
}
