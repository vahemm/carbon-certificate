import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import CarbonCertificateEntity from './carbon-certificate.entity';
import CarbonCertificate from './carbon-certificate.entity';
import { Repository } from 'typeorm';
import { CarbonCertificateStatusEnum } from './enums/carbon-certificate-status.enum';

@Injectable()
export class CarbonCertificatesService {
  constructor(
    @InjectRepository(CarbonCertificateEntity)
    private carbonCertificateRepository: Repository<CarbonCertificateEntity>,
  ) {}

  async createCarbonCertificate(body) {
    return this.carbonCertificateRepository.save(body);
  }

  async updateCarbonCertificateOwner(currentUserId, body) {
    const result = await this.carbonCertificateRepository.manager
      .createQueryBuilder()
      .update(CarbonCertificate)
      .where('owner = :ownerId', { ownerId: currentUserId })
      .andWhere('id = :id', { id: body.carbonCertificateId })
      .set({
        owner: body.owner,
        status: CarbonCertificateStatusEnum.TRANSFERRED,
      })
      .execute();

    if (!result.affected) {
      throw new NotFoundException();
    }

    return this.carbonCertificateRepository.findOne({
      where: { id: body.carbonCertificateId },
    });
  }

  async getMyCarbonCertificate(userId: number) {
    return this.carbonCertificateRepository.manager
      .createQueryBuilder()
      .from(CarbonCertificate, 'carbon_certificate')
      .where('carbon_certificate.owner = :id', { id: userId })
      .select([
        'carbon_certificate.id',
        'carbon_certificate.country',
        'carbon_certificate.status',
        'carbon_certificate.owner',
      ])
      .leftJoin('carbon_certificate.owner', 'user')
      .addSelect(['user.id', 'user.name', 'user.email'])
      .getMany();
  }

  async getOwnerLessCarbonCertificates() {
    return this.carbonCertificateRepository.manager
      .createQueryBuilder()
      .from(CarbonCertificate, 'carbon_certificate')
      .where('carbon_certificate.owner is null')
      .select([
        'carbon_certificate.id',
        'carbon_certificate.country',
        'carbon_certificate.status',
        'carbon_certificate.owner',
      ])
      .leftJoin('carbon_certificate.owner', 'user')
      .addSelect(['user.id', 'user.name', 'user.email'])
      .getMany();
  }
}
