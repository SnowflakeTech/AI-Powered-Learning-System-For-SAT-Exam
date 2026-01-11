import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const url = String(req?.originalUrl || req?.url || "");

    if (url.startsWith("/api/v1/auth/")) return true;
    if (url.startsWith("/api/v1/user/register")) return true;
    if (url.startsWith("/api/v1/lookup/")) return true;
    if (url.startsWith("/uploads/")) return true;

    return super.canActivate(context);
  }
}
