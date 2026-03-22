import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { EinladungModule } from '../einladung/einladung.module';
import { RollenVorlageModule } from '../rollen-vorlage/rollen-vorlage.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), EinladungModule, RollenVorlageModule],
  controllers: [AuthController, TwoFactorController],
  providers: [AuthService, TwoFactorService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, TwoFactorService],
})
export class AuthModule {}
