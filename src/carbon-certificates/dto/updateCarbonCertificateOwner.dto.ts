import { IsNumber } from 'class-validator';

export class UpdateCarbonCertificateOwnerDto {
  @IsNumber()
  carbonCertificateId: number;

  @IsNumber()
  owner: number;
}
