import { FindAllOption, FindAllResponse } from '../types';

export type DeleteResponse = {
  ok?: number;
  n?: number;
} & {
  deletedCount?: number;
};

export interface IBaseRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  updateById(id: string, doc: Partial<T>): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;

  findOne(cond: Partial<T>): Promise<T>;
  findOneAndUpdate(cond: Partial<T>, doc: Partial<T>): Promise<T>;
  findMany(cond: Partial<T>): Promise<T[]>;
  findAll(cond: Partial<T>, option?: Partial<FindAllOption>): Promise<FindAllResponse<T>>;
}
