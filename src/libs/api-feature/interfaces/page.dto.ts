export class PageOptionsDto {
  page?: number = 1;
  limit?: number = 10;
}

export interface PageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  itemCount: number;
}

export class PageMetaDto {

  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;

  constructor({ pageOptionsDto, itemCount }: PageMetaDtoParameters) {
    const { limit, page } = pageOptionsDto;

    this.totalItems = itemCount
    this.itemsPerPage = limit;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = page;
    this.hasPreviousPage = this.currentPage > 1;
    this.hasNextPage = this.currentPage < this.totalPages;
  }
}

export class PageDto<T> {
  data: T[];

  meta: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
