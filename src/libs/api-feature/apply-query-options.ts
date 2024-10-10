import {
  Brackets,
  FindManyOptions,
  ILike,
  In,
  SelectQueryBuilder,
} from 'typeorm';
import { FilterInterface, SortOrder } from './filter.interface';
import { PageDto, PageMetaDto } from './interfaces/page.dto';
import { startOfDay, endOfDay } from 'date-fns';
import { EntityFilterElementType, EntityFromOtherTable, isSearchFromOtherTable, NotHave } from './abstract.entity';

const handleOperatorValue = (
  value: any,
): {
  operator: string;
  value: any;
} => {
  let operator = '';

  while (value['@instanceof'] === Symbol.for('FindOperator')) {
    operator += `${value._type} `;
    value = value._value;
  }

  return {
    operator,
    value,
  };
};

const handleSingleValueQueryBuilder = ({
  keyFilter,
  query,
}: {
  query: SelectQueryBuilder<any>;
  keyFilter: EntityFromOtherTable;
}): {
  query: SelectQueryBuilder<any>;
  alias: string;
  key: string;
} => {
  const isRelation = !!keyFilter.relation;

  if (!isRelation) {
    const { key } = keyFilter;
    return {
      query: query,
      alias: query.alias,
      key,
    };
  } else {
    const { key, relation } = keyFilter;
    let alias = `${query.alias}_${key}_`;

    // Check if the join already exists
    const existingJoin = query.expressionMap.joinAttributes.find(
      (join) => {
        return join.alias.name === key;
      }
    );

    if (!existingJoin) {
      query = query.leftJoin(`${query.alias}.${key}`, alias);
    } else {
      alias = existingJoin.alias.name;
    }

    return {
      query,
      alias,
      key: relation.key,
    };
  }
};


const handleValueQueryBuilder = ({
  keyFilter,
  query,
  value,
}: {
  query: SelectQueryBuilder<any>;
  value: any;
  keyFilter: EntityFilterElementType;
}): SelectQueryBuilder<any> => {

  const {
    alias: newAlias,
    key: newKey,
    query: newQuery,
  } = handleSingleValueQueryBuilder({
    keyFilter,
    query,
  });

  if (value instanceof Date) {
    return newQuery.andWhere(
      `${newAlias}.${newKey} BETWEEN :startOfDay AND :endOfDay`,
      {
        startOfDay: startOfDay(new Date(value)),
        endOfDay: endOfDay(new Date(value)),
      },
    );
  } else if (Array.isArray(value)) {
    return newQuery.andWhere(`${newAlias}.${newKey} IN (:...${newKey})`, {
      [newKey]: value,
    });
  } else if (NotHave.isNotHave(value)) {
    const values: any[] = value.notHave;

    // Create a subquery that selects the IDs of entities that match the given condition
    const subQuery = query
      .subQuery()
      .select(`${query.alias}.id`)
      .from(query.alias, query.alias)
      .leftJoin(`${query.alias}.${keyFilter.key}`, 'relationAlias')
      .where(
        `relationAlias.${keyFilter.relation?.key} IN (:...values)`,
        { values },
      )
      .getQuery();

    // Apply the NOT IN condition with the subquery to exclude matching records
    query = query.andWhere(`${query.alias}.id NOT IN (${subQuery})`);

    return query;
  } else {
    const isValueNull = value === null || value === undefined;

    if (isValueNull) {
      return newQuery.andWhere(`${newAlias}.${newKey} IS NULL`);
    } else {
      if (value && value['@instanceof'] === Symbol.for('FindOperator')) {
        const { operator, value: textValue } = handleOperatorValue(value);
        return newQuery.andWhere(
          `${newAlias}.${newKey} ${operator} (:${newKey})`,
          {
            [newKey]: textValue,
          },
        );
      } else {
        return newQuery.andWhere(`${newAlias}.${newKey} = :${newKey}`, {
          [newKey]: value,
        });
      }
    }
  }
};

const handleQueryBuilderOptionsSearch = (filter: FilterInterface, query: SelectQueryBuilder<any>) => {
  const { search, entitySearchKey } = filter;

  query.andWhere(new Brackets((qb) => {
    entitySearchKey.forEach((key) => {
      if (isSearchFromOtherTable(key)) {
        const { alias, key: newKey, query: newQuery } = handleSingleValueQueryBuilder({
          keyFilter: key as EntityFromOtherTable,
          query,
        });

        qb.orWhere(`${alias}.${newKey} LIKE :search`, {
          search: `%${search}%`,
        });
      } else {
        qb.orWhere(`${query.alias}.${key} LIKE :search`, {
          search: `%${search}%`,
        });
      }
    });
  }));

  return query;
}

export const applyQueryFilter = (
  query: SelectQueryBuilder<any>,
  filter: FilterInterface,
  isRaw: boolean = false,
) => {
  const {
    filters,
    limit,
    order,
    page,
    sort_key,
    entitySearchKey,
    search,
    entityFilterKeys,
    entitySortKeys,
  } = filter;

  // add the search query
  if (search) {
    query = handleQueryBuilderOptionsSearch(filter, query);
  }

  // add the sort
  if (sort_key) {
    const orderValue = order == SortOrder.ASC ? 'ASC' : 'DESC';
    query = query.orderBy(`${query.alias}.${sort_key}`, orderValue);
  }

  // add the filters
  if (filters) {
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      const keyFilter = entityFilterKeys.find((filter) => filter.key === key);
      query = handleValueQueryBuilder({
        keyFilter,
        query,
        value,
      });
    });
  }

  // add the pagination
  const offset = (page - 1) * limit;

  if (isRaw) {
    query = query.offset(offset).limit(limit);
  } else {
    query = query.skip(offset).take(limit);
  }

  return query;
};

export const applyQueryBuilderOptions = async (
  query: SelectQueryBuilder<any>,
  filter: FilterInterface,
): Promise<PageDto<any>> => {
  const { limit, page } = filter;

  query = applyQueryFilter(query, filter);

  const [entities, itemCount] = await query.getManyAndCount();

  const pageMetaDto = new PageMetaDto({
    itemCount,
    pageOptionsDto: {
      page,
      limit,
    },
  });
  return new PageDto(entities, pageMetaDto);
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function handleSingleValue(value: any, filter: EntityFilterElementType) {
  if (value instanceof Date) {
    return {
      $gte: startOfDay(new Date(value)),
      $lte: endOfDay(new Date(value)),
    };
  } else if (Array.isArray(value)) {
    return In(value);
  } else if(NotHave.isNotHave(value)) {
    const notHaveValues = value.notHave;
  }
  else {
    return value;
  }
}

const handleValueWithRelation = ({
  value,
  filter,
}: {
  value: any;
  filter: EntityFilterElementType;
}) => {
  const isRelation = !!filter.relation;
  if (!isRelation) {
    return handleSingleValue(value, filter);
  }

  return {
    [filter.relation.key]: handleSingleValue(value, filter),
  };
};

const handleQueryOptionSearch = (filter: FilterInterface) => {
  const { search, entitySearchKey } = filter;

  return entitySearchKey.map((key) => {
    if(isSearchFromOtherTable(key)){
      const objSearch = key as EntityFromOtherTable;
      return {
        [objSearch.key]: {
          [objSearch.relation.key]: ILike(`%${search}%`),
        }
      }
    }
    else {
      return {
        [key as string]: ILike(`%${search}%`),
      }
    }
  });

}

export const getQueryQueryOptions = (
  filter: FilterInterface,
  options: FindManyOptions<any> = {},
): FindManyOptions<any> => {
  const {
    filters,
    limit,
    order,
    page,
    sort_key,
    entitySearchKey,
    search,
    entityFilterKeys,
    entitySortKeys,
  } = filter;

  if (!options.where) {
    options.where = [{}];
  } else if (!Array.isArray(options.where)) {
    options.where = [options.where];
  }

  // Add sorting
  if (sort_key) {
    options.order = {
      [sort_key]: order === SortOrder.ASC ? 'ASC' : 'DESC',
    };
  }

  // Add filters
  if (filters) {
    const newFilters = Object.keys(filters).reduce((acc, key) => {
      const value = filters[key];
      const keyFilter = entityFilterKeys.find((filter) => filter.key === key);
      acc[key] = handleValueWithRelation({
        filter: keyFilter,
        value,
      });
      return acc;
    }, {});

    if (Object.keys(newFilters).length > 0) {
      options.where.forEach((individualWhere) => {
        Object.assign(individualWhere, newFilters);
      });
    }
  }

  // Add search conditions using OR logic
  if (search && entitySearchKey.length > 0) {
    const searchConditions = handleQueryOptionSearch(filter);
    options.where = options.where.map((where) => {
      return searchConditions.map((condition) => {
        return {
          ...where,
          ...condition,
        };
      });
    });
    options.where = options.where.flat();
  }

  // Add pagination
  options.take = limit;
  options.skip = (page - 1) * limit;

  return options;
};

export function createPageMetaDto(
  entities: any[],
  {
    itemCount,
    page,
    limit,
  }: {
    itemCount: number;
    page: number;
    limit: number;
  },
): PageDto<any> {
  const meta = new PageMetaDto({
    itemCount,
    pageOptionsDto: {
      page,
      limit,
    },
  });
  return new PageDto(entities, meta);
}
