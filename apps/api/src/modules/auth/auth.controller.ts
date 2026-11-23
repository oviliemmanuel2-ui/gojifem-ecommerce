import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterCustomerDto,
  RegisterVendorDto,
  LoginDto,
  RefreshTokenDto,
  GoogleAuthCallbackDto,
  AppleAuthCallbackDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RequestEmailVerificationDto,
  VerifyEmailDto,
} from './auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from './decorators/current-user.decorator';

@ApiTags('Authentication & Identity')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Customer account created' })
  async register(@Body() dto: RegisterCustomerDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('vendor-register')
  @ApiOperation({ summary: 'Register a new merchant owner account & initial draft vendor store' })
  @ApiResponse({ status: 201, description: 'Vendor account created in DRAFT status' })
  async registerVendor(@Body() dto: RegisterVendorDto) {
    return this.authService.registerVendor(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, description: 'User authenticated, tokens issued' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google/url')
  @ApiOperation({ summary: 'Get official Google OAuth 2.0 authorization URL' })
  async getGoogleUrl(@Query('intent') intent?: string) {
    return this.authService.getGoogleAuthUrl(intent);
  }

  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Google OAuth authorization code for GOJIFEM JWT session' })
  async googleCallback(@Body() dto: GoogleAuthCallbackDto) {
    return this.authService.handleGoogleCallback(dto);
  }

  @Get('apple/url')
  @ApiOperation({ summary: 'Get official Sign in with Apple authorization URL' })
  async getAppleUrl(@Query('intent') intent?: string) {
    return this.authService.getAppleAuthUrl(intent);
  }

  @Post('apple/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Sign in with Apple callback (form_post or JSON)' })
  async appleCallback(
    @Body() dto: AppleAuthCallbackDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const contentType = req.headers['content-type'] || '';
    const isFormPost = contentType.includes('application/x-www-form-urlencoded');
    const webUrl = (process.env.WEB_URL || 'http://localhost:3000').split(',')[0].trim().replace(/\/$/, '');

    try {
      const result = await this.authService.handleAppleCallback(dto);
      if (isFormPost) {
        const hashParams = new URLSearchParams({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
        return res.redirect(`${webUrl}/auth/callback/apple#${hashParams.toString()}`);
      }
      return res.status(HttpStatus.OK).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Apple Sign-In failed';
      if (isFormPost) {
        return res.redirect(
          `${webUrl}/auth/callback/apple?error=${encodeURIComponent(message)}`,
        );
      }
      return res.status(HttpStatus.UNAUTHORIZED).json({ message });
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request or resend an email verification link' })
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.authService.requestEmailVerification(dto.email);
  }

  @Post('verify-email/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify account email address using token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out current session' })
  async logout(@Req() req: Request) {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    return this.authService.logout(user?.userId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange refresh token for fresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve authenticated profile, addresses, roles and merchant stores' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }
}
