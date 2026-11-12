import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuthModule } from './modules/auth/auth.module';
import { VendorsModule } from './modules/vendors/vendors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    HealthModule,
    ShippingModule,
    PaymentsModule,
    AuthModule,
    VendorsModule,
  ],
})
export class AppModule {}
