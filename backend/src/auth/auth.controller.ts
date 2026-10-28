import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.authService.getProfile(request.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(request.user?.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(request.user?.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-protected')
  async getTestProtected() {
    return {
      message: 'JWT арқылы қорғалған endpoint жұмыс істеп тұр',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('test-protected')
  async testProtected() {
    return {
      message: 'JWT арқылы қорғалған endpoint жұмыс істеп тұр',
    };
  }
}