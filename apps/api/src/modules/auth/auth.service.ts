import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { prisma, UserAccountStatus, VendorStatus } from '@gojifem/database';
import { UserRole } from '@gojifem/types';
import { RegisterCustomerDto, RegisterVendorDto, LoginDto } from './auth.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async registerCustomer(dto: RegisterCustomerDto) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, dto.phone ? { phone: dto.phone } : {}],
      },
    });

    if (existing) {
      throw new ConflictException('An account with this email or phone number already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        accountStatus: UserAccountStatus.ACTIVE,
        customerProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
      include: {
        customerProfile: true,
      },
    });

    // Assign CUSTOMER role
    const customerRole = await prisma.role.findUnique({ where: { code: UserRole.CUSTOMER } });
    if (customerRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: customerRole.id,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, [UserRole.CUSTOMER], []);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roles: [UserRole.CUSTOMER],
      },
      ...tokens,
    };
  }

  async registerVendor(dto: RegisterVendorDto) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { phone: dto.phone }],
      },
    });

    if (existing) {
      throw new ConflictException('An account with this email or phone number already exists');
    }

    // Slugify display name
    const slugBase = dto.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        accountStatus: UserAccountStatus.ACTIVE,
        ownedVendors: {
          create: {
            legalName: dto.legalName,
            displayName: dto.displayName,
            slug: uniqueSlug,
            status: VendorStatus.DRAFT,
            commissionRateBps: 1000, // 10%
            description: dto.operatingLocation ? `Located in ${dto.operatingLocation}` : undefined,
          },
        },
      },
      include: {
        ownedVendors: true,
      },
    });

    const vendor = user.ownedVendors[0];

    // Link Vendor Membership
    await prisma.vendorMembership.create({
      data: {
        vendorId: vendor.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    // Assign VENDOR_OWNER role
    const vendorRole = await prisma.role.findUnique({ where: { code: UserRole.VENDOR_OWNER } });
    if (vendorRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: vendorRole.id,
          vendorId: vendor.id,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, [UserRole.VENDOR_OWNER], [vendor.id]);

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: [UserRole.VENDOR_OWNER],
      },
      vendor: {
        id: vendor.id,
        displayName: vendor.displayName,
        slug: vendor.slug,
        status: vendor.status,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        customerProfile: true,
        userRoles: {
          include: { role: true },
        },
        vendorMemberships: {
          where: { isActive: true },
          include: { vendor: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.accountStatus !== UserAccountStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.accountStatus.toLowerCase()}`);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.code)));
    const vendorIds = user.vendorMemberships.map((vm) => vm.vendorId);

    const tokens = await this.generateTokens(user.id, user.email, roles, vendorIds);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.customerProfile?.firstName,
        lastName: user.customerProfile?.lastName,
        roles,
        vendors: user.vendorMemberships.map((vm) => ({
          id: vm.vendor.id,
          name: vm.vendor.displayName,
          slug: vm.vendor.slug,
          status: vm.vendor.status,
          role: vm.role,
        })),
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_at_least_32_chars',
      });

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: { include: { role: true } },
          vendorMemberships: { where: { isActive: true } },
        },
      });

      if (!user || user.accountStatus !== UserAccountStatus.ACTIVE) {
        throw new UnauthorizedException('User account invalid or suspended');
      }

      const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.code)));
      const vendorIds = user.vendorMemberships.map((vm) => vm.vendorId);

      return this.generateTokens(user.id, user.email, roles, vendorIds);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        addresses: true,
        userRoles: { include: { role: true } },
        vendorMemberships: {
          include: { vendor: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      profile: user.customerProfile,
      addresses: user.addresses,
      roles: user.userRoles.map((ur) => ur.role.code),
      vendors: user.vendorMemberships.map((vm) => ({
        id: vm.vendor.id,
        name: vm.vendor.displayName,
        slug: vm.vendor.slug,
        status: vm.vendor.status,
        role: vm.role,
      })),
    };
  }

  private async generateTokens(userId: string, email: string, roles: string[], vendorIds: string[]) {
    const payload: JwtPayload = { sub: userId, email, roles, vendorIds };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_chars_long',
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_at_least_32_chars',
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }
}
