import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CarbonCertificateStatusEnum } from './enums/carbon-certificate-status.enum';
import User from '../users/user.entity';

@Entity()
class CarbonCertificate {
  @PrimaryGeneratedColumn()
  public id?: number;

  @Column()
  public country: string;

  @Column({
    type: 'enum',
    enum: CarbonCertificateStatusEnum,
  })
  public status: CarbonCertificateStatusEnum;

  @ManyToOne(() => User, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn()
  public owner: number;
}

export default CarbonCertificate;
