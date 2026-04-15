import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signUp(email: string, displayName: string, password: string, age: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName,
        password: hashedPassword,
        age,
      },
    });

    // Generate JWT
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
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT
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
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return the same message to prevent email enumeration
    if (!user) return { message: 'If that email is registered, a code has been sent' };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { email },
      data: { passwordResetToken: otp, passwordResetExpires: expires },
    });

    await this.sendResetEmail(email, otp);
    return { message: 'If that email is registered, a code has been sent' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      !user.passwordResetToken ||
      !user.passwordResetExpires ||
      user.passwordResetToken !== otp ||
      new Date() > user.passwordResetExpires
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashed, passwordResetToken: null, passwordResetExpires: null },
    });

    return { message: 'Password reset successfully' };
  }

  private async sendResetEmail(email: string, otp: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Boulder Buds" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Password Reset Code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#FF8C00;margin:0 0 16px;">Boulder Buds</h2>
          <p style="color:#374151;margin:0 0 24px;">Enter this code to reset your password:</p>
          <div style="background:#F9FAFB;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1F2937;">${otp}</span>
          </div>
          <p style="color:#6B7280;font-size:14px;">
            This code expires in <strong>15 minutes</strong>.
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }
}