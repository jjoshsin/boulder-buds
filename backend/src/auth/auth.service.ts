import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

@Injectable()
export class AuthService {
  private appleJwksClient: jwksClient.JwksClient;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.appleJwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      rateLimit: true,
    });
  }

  async validateAppleToken(identityToken: string, appleUserId: string) {
    try {
      const decodedToken = jwt.decode(identityToken, { complete: true }) as any;
      
      if (!decodedToken) {
        throw new UnauthorizedException('Invalid token');
      }

      const key = await this.appleJwksClient.getSigningKey(decodedToken.header.kid);
      const signingKey = key.getPublicKey();

      const verified = jwt.verify(identityToken, signingKey, {
        audience: process.env.APPLE_CLIENT_ID,
        issuer: 'https://appleid.apple.com',
      }) as any;

      let user = await this.prisma.user.findUnique({
        where: { appleId: appleUserId },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            appleId: appleUserId,
            email: verified.email || `${appleUserId}@appleid.com`,
            displayName: 'Climber',
          },
        });
      }

      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      };
    } catch (error) {
      console.error('Apple auth error:', error);
      throw new UnauthorizedException('Invalid Apple token');
    }
  }

  async validateGoogleToken(idToken: string) {
    try {
      const decoded = jwt.decode(idToken) as any;
      
      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      let user = await this.prisma.user.findUnique({
        where: { googleId: decoded.sub },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            googleId: decoded.sub,
            email: decoded.email,
            displayName: decoded.name || 'Climber',
          },
        });
      }

      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      };
    } catch (error) {
      console.error('Google auth error:', error);
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}