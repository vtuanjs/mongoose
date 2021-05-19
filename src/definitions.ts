export interface IMongoConfig {
  connectionString?: string;
  user?: string;
  password?: string;
}

export type UpdateOptions = {
  new?: boolean;
  upsert?: boolean;
};

export interface IBaseRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  updateById(id: string, doc: Partial<T>): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;

  findOne(cond: Partial<T>): Promise<T>;
  findOneAndUpdate(cond: Partial<T>, doc: Partial<T>, options?: UpdateOptions): Promise<T>;
  findMany(cond: Partial<T>): Promise<T[]>;
  findAll(cond: Partial<T>, option?: Partial<FindAllOption>): Promise<FindAllResponse<T>>;
}

export interface ILogger {
  info(message?: string, details?: any): void;
  error(message?: string, details?: any): void;
  warn(message?: string, details?: any): void;
  debug(message?: string, details?: any): void;
}

export interface ISystemNotify {
  sendErrorToTelegram(title: string, error?: any): Promise<void>;
  sendSuccessMessageToTelegram(title: string): Promise<void>;
}

export type DeleteResponse = {
  ok?: number;
  n?: number;
} & {
  deletedCount?: number;
};

export type PartialDeep<T> = { [P in keyof T]?: PartialDeep<T[P]> };

export type FindAllOption = {
  fields: string;
  limit: number;
  page: number;
  sort: any;
};

export type FindAllResponse<T> = {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  data: T[];
};
