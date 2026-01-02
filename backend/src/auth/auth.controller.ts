import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('apple')
  async appleSignIn(@Body() body: { identityToken: string; user: string }) {
    return this.authService.validateAppleToken(body.identityToken, body.user);
  }

  @Post('google')
  async googleSignIn(@Body() body: { idToken: string }) {
    return this.authService.validateGoogleToken(body.idToken);
  }
}