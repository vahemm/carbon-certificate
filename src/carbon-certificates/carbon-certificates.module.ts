import { Module } from '@nestjs/common';
import { CarbonCertificatesController } from './carbon-certificates.controller';
import { CarbonCertificatesService } from './carbon-certificates.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import CarbonCertificate from './carbon-certificate.entity';
import User from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarbonCertificate, User])],

  controllers: [CarbonCertificatesController],
  providers: [CarbonCertificatesService],
})
export class CarbonCertificatesModule {}
