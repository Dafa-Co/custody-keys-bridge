import { Exclude, Expose } from 'class-transformer';
import {
  AbstractEntity,
  AllowedFilterTypes,
  EntityFilterElementType,
  EntitySearchElementType,
} from 'src/libs/api-feature/abstract.entity';
import { FilterInterface } from 'src/libs/api-feature/filter.interface';
import { getKey } from 'src/libs/urils/enum-keys';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum SyncRequestStatus {
  SUCCESS,
  PENDING,
  FAILED,
  AUTH_FAILED,
}

@Entity('sync_requests')
export class SyncRequest extends AbstractEntity {
  constructor() {
    super(syncSortKeys, syncSearchKeys, syncFilterKeys);
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  adminId: number;

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  vaultId: number;

  @Exclude()
  @Column({ type: 'varchar', length: 400 })
  syncUrl: string;

  @Exclude()
  @Column({ type: 'varchar', length: 50 })
  verifyKey: string;

  @Exclude()
  @Column({ type: 'tinyint', default: SyncRequestStatus.PENDING })
  status: SyncRequestStatus;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  encryptedUrl: string;

  @Expose({ name: 'status' })
  get syncStatus() {
    return getKey(this.status, SyncRequestStatus);
  }

  @Expose({ name: 'syncUrl' })
  get getSyncUrl() {
    if (!this.encryptedUrl) return undefined;
    return this.encryptedUrl;
  }
}

const syncSortKeys: string[] = [];
const syncSearchKeys: EntitySearchElementType[] = [];
const syncFilterKeys: EntityFilterElementType[] = [
    {
        key: 'adminId',
        type: [AllowedFilterTypes.number],
    },
    {
        key: 'status',
        type: [AllowedFilterTypes.enum],
        enum: SyncRequestStatus,
    }
];


export class SyncRequestFilter extends FilterInterface {
    constructor() {
      super(new SyncRequest());
    }
  }
