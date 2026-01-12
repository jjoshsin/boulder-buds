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
    console.log('🍎 Apple Sign In - Development Mode (Expo Go)');
    console.log('User ID:', appleUserId);
    
    // DEVELOPMENT MODE: Skip token verification in Expo Go
    // In production with EAS Build, uncomment the production code
    
    // Try to find user by email (using appleUserId since we don't have verified email in dev mode)
    const email = `${appleUserId}@appleid.com`;
    console.log('Looking for user with email:', email);
    
    let user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      console.log('User not found, creating new user');
      user = await this.prisma.user.create({
        data: {
          appleId: appleUserId,
          email: email,
          displayName: 'Climber',
        },
      });
      console.log('New user created:', user.id);
    } else {
      console.log('Existing user found:', user.id);
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
    // ============================================
    // END DEVELOPMENT MODE
    // ============================================

    /* ============================================
    // PRODUCTION MODE (EAS Build / App Store)
    // Uncomment this when building with EAS
    // ============================================
    
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
    
    ============================================
    END PRODUCTION MODE
    ============================================ */
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