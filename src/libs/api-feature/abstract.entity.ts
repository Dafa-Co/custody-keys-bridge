import { Exclude, Expose } from 'class-transformer';
import { format } from 'date-fns';
import {
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';



export abstract class NotHave {
  notHave: any[];
  static isNotHave(value: any): boolean {
    return (value && typeof value === 'object' && 'notHave' in value);
  }
}

export enum AllowedFilterTypes {
  number = 'number',
  string = 'string',
  boolean = 'boolean',
  enum = 'enum',
  date = 'date',
  nullableNumber = 'nullableNumber',
  In = 'In',
  NotIn = 'NotIn',
  // this is specifically for the many to many relations
  // Not supported by the find with Typeorm
  notHave = 'notHave',
}

export enum InValidation {
  number = AllowedFilterTypes.number,
  string = AllowedFilterTypes.string,
  enum = AllowedFilterTypes.enum,
}

export abstract class Relation {
  key = 'id'; // this is the key of the relation in the other entity
}

export interface EntityFilterElementType extends EntityFromOtherTable{
  type: AllowedFilterTypes[];
  enum?: any;
  inValidation?: InValidation;
};

export type EntitySearchElementType = string | EntityFromOtherTable;

export const isSearchFromOtherTable = (EntitySearchElementType: EntitySearchElementType) :boolean => {
  return typeof EntitySearchElementType === 'object' && 'key' in EntitySearchElementType;
};

export class EntityFromOtherTable {
  key: string; // this is the key of the relation in the main entity
  relation?: Relation;
};

export abstract class AbstractEntity {
  @Exclude()
  sortKeys: string[];
  @Exclude()
  searchKeys: EntitySearchElementType[];
  @Exclude()
  filterKeys: EntityFilterElementType[];

  constructor(
    sortKey: string[],
    searchKeys: EntitySearchElementType[],
    filterKeys: EntityFilterElementType[],
  ) {
    this.sortKeys = sortKey;
    this.searchKeys = searchKeys;
    this.filterKeys = filterKeys;
  }

  @Exclude()
  @CreateDateColumn({ name: 'created_at', nullable: true })
  public created_at: Date;

  @Exclude()
  @UpdateDateColumn({
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    })
  @Exclude()
  public updated_at: Date;

  @Expose({ name: 'created_at' })
  getCreatedAt() {
    if (!this.created_at) return undefined;
    return format(new Date(this.created_at), 'dd MMMM, yyyy HH:mm:ss');
  }

  @Expose({ name: 'updated_at' })
  getUpdatedAt() {
    if (!this.updated_at) return undefined;
    return format(new Date(this.updated_at), 'dd MMMM, yyyy HH:mm:ss');
  }
}
