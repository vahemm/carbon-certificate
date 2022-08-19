import { CarbonCertificateStatusEnum } from '../enums/carbon-certificate-status.enum';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateCarbonCertificateDto {
  @IsString()
  country: string;
  @IsEnum(CarbonCertificateStatusEnum, {
    message: 'status must be on of this values: available, owned, transferred.',
  })
  status: string;
  @IsNumber()
  owner: number;
}
