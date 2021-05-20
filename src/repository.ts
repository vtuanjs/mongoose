import {
  mongo,
  model,
  Document,
  Schema,
  Model,
  FilterQuery,
  CreateQuery,
  UpdateQuery
} from 'mongoose';

import { FindAllOption, FindAllResponse, IBaseRepository, UpdateOptions } from './definitions';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  model: Model<T & Document>;

  constructor(name: string, schema: Schema, collection: string) {
    this.model = model<T & Document>(name, schema, collection);
  }

  protected removeUndefinedValue(object: Record<string, unknown>): void {
    for (const key of Object.keys(object)) {
      if (object[key] === undefined) delete object[key];
    }
  }

  /**
   * Create body of $set function. It will use to update sub-document.
   *
   * Return: { "subDocumentName.$.key": "value" }
   */
  protected createSetOfSubDocument<Doc, SubDoc>(
    subDocumentName: keyof Doc,
    subDocument: Partial<SubDoc>
  ): {
    [key: string]: unknown;
  } {
    const object: Record<string, string> = {};
    for (const key of Object.keys(subDocument)) {
      object[`${subDocumentName}.$.${key}`] = (subDocument as any)[key];
    }
    return object;
  }

  protected createObjectID(): string {
    return new mongo.ObjectId().toHexString();
  }

  @Repository(false)
  async create(entity: Partial<T>): Promise<T> {
    delete (entity as any).id;

    const _entity = await this.model.create(entity as CreateQuery<T & Document>);
    const doc = _entity.toObject();
    return doc;
  }

  @Repository()
  async updateById(id: string, doc: Partial<T>): Promise<boolean> {
    delete (doc as any).id;

    const raw = await this.model.updateOne({ _id: id as any }, doc as UpdateQuery<T & Document>);
    if (raw.ok === 0) {
      throw new Error('Update failed');
    }
    return raw.nModified === 0 ? false : true;
  }

  @Repository()
  async findOne(cond: Partial<T>): Promise<T> {
    const entity = await this.model.findOne(cond as FilterQuery<T & Document>).lean();
    return entity as T;
  }

  @Repository()
  async findMany(cond: Partial<T>): Promise<T[]> {
    const entity = await this.model.find(cond as FilterQuery<T & Document>).lean();
    return entity as T[];
  }

  @Repository()
  async findOneAndUpdate(cond: Partial<T>, doc: Partial<T>, options?: UpdateOptions): Promise<T> {
    delete (doc as any).id;

    const entity = await this.model
      .findOneAndUpdate(cond as FilterQuery<T & Document>, doc as UpdateQuery<T & Document>, {
        new: true,
        ...options
      })
      .lean();
    return entity as T;
  }

  @Repository()
  async findAll(cond: Partial<T>, option: Partial<FindAllOption>): Promise<FindAllResponse<T>> {
    if (!option) option = {};
    const { fields } = option;
    let { sort = 'id', limit = 50, page = 1 } = option;

    if (sort && sort.includes('id') && !sort.includes('_id')) {
      sort = sort.replace('id', '_id');
    }

    if (limit > 50 || limit < 1) limit = 50;
    if (page < 1) page = 1;

    const count = await this.model.countDocuments(cond as FilterQuery<T & Document>);

    const items = await this.model
      .find(cond as FilterQuery<T & Document>)
      .select(selectFieldsShow(fields))
      .limit(limit)
      .skip(limit * (page - 1))
      .sort(sort)
      .lean();

    transformEntities(items);

    return {
      total: count,
      limit,
      page,
      totalPages: Math.ceil(count / limit),
      data: items as T[]
    };
  }

  @Repository()
  async deleteById(id: string): Promise<boolean> {
    const raw = await this.model.deleteOne({ _id: id as any });

    if (raw.ok === 0) {
      throw new Error('Delete failed');
    }
    return raw.n === 0 ? false : true;
  }

  @Repository()
  async count(cond: Partial<T>): Promise<number> {
    const count = await this.model.countDocuments(cond as FilterQuery<T & Document>);
    return count;
  }
}

export function Repository(transformInputCondition = true, transformOutputEntities = true) {
  return (
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => Promise<any>>
  ): void => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const oldFunc = descriptor.value!;
    descriptor.value = async function (...args: any[]) {
      const newQuery = transformQueryCondition(args[0]);
      if (transformInputCondition && newQuery !== null) {
        args[0] = newQuery;
      }
      const entities = await oldFunc.apply(this, args);

      transformOutputEntities && transformEntities(entities);

      return entities;
    };
  };
}

function transformQueryCondition(cond: Record<string, unknown>): Record<string, unknown> | null {
  if (!isObject(cond)) return null;

  const result = { ...cond };
  if (result.id) {
    result._id = result.id;
    delete result.id;
  }
  return result;
}

function transformEntities(entity: any): void {
  if (!isObject(entity)) return;

  if (Array.isArray(entity)) {
    entity.map((item) => {
      if (item?._id) {
        item.id = item._id.toString();
        delete item._id;
      }
    });

    return;
  }

  if (entity._id) {
    entity.id = entity._id.toString();
    delete entity._id;
  }
}

function isObject(entity: any) {
  return typeof entity === 'object' && entity != null;
}

function selectFieldsShow(fields?: string) {
  if (fields) {
    return fields.split(',').join(' ');
  }

  return '';
}
