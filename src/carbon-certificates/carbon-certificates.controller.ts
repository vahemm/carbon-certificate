import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import JwtAuthenticationGuard from '../authentication/jwt-authentication.guard';
import { CarbonCertificatesService } from './carbon-certificates.service';
import { CreateCarbonCertificateDto } from './dto/createCarbonCertificate.dto';
import User from '../users/user.entity';
import { UpdateCarbonCertificateOwnerDto } from './dto/updateCarbonCertificateOwner.dto';

@Controller('carbon-certificates')
export class CarbonCertificatesController {
  constructor(
    private readonly carbonCertificatesService: CarbonCertificatesService,
  ) {}

  @Get('my')
  @UseGuards(JwtAuthenticationGuard)
  getMyCarbonCertificates(@Req() req: { user?: User }) {
    return this.carbonCertificatesService.getMyCarbonCertificate(req.user?.id);
  }

  @Get('ownerless')
  @UseGuards(JwtAuthenticationGuard)
  getOwnerLessCarbonCertificates() {
    return this.carbonCertificatesService.getOwnerLessCarbonCertificates();
  }

  @Put('my')
  @UseGuards(JwtAuthenticationGuard)
  updateCarbonCertificateOwner(
    @Body() body: UpdateCarbonCertificateOwnerDto,
    @Req() req: { user?: User },
  ) {
    return this.carbonCertificatesService.updateCarbonCertificateOwner(
      req.user.id,
      body,
    );
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  createCarbonCertificate(
    @Body() body: CreateCarbonCertificateDto,
    @Req() req: { user?: User },
  ) {
    return this.carbonCertificatesService.createCarbonCertificate(body);
  }
}
