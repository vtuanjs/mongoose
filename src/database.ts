import { connection, connect, Schema, Mongoose } from 'mongoose';
import { IMongoConfig, ILogger, ISystemNotify } from './definitions';

export { Schema, FilterQuery, CreateQuery, UpdateQuery, Document } from 'mongoose';
export const Mixed = Schema.Types.Mixed;

export class MongoDB {
  logger: ILogger;
  config: IMongoConfig;
  systemNotify: ISystemNotify;

  constructor(
    {
      connectionString = 'mongodb://localhost:27017/example',
      user = '',
      password = ''
    }: IMongoConfig,
    logger: ILogger = console,
    systemNotify?: ISystemNotify
  ) {
    this.logger = logger;
    this.config = {
      connectionString,
      user,
      password
    };
    this.systemNotify = systemNotify;
    this.listen();
  }

  connect(): Promise<Mongoose> {
    return connect(this.config.connectionString, {
      user: this.config.user,
      pass: this.config.password,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
  }

  private listen() {
    connection.on('connecting', () => {
      this.logger.info('Connecting to Mongodb');
    });

    connection.on('connected', () => {
      this.logger.info('Connected to Mongodb \n');
    });

    connection.on('disconnected', () => {
      this.sendErrorToTelegram('🟩 MongoDB - Disconnected');
      this.logger.warn('Disconnected Mongodb');
    });

    connection.on('error', (err: Error) => {
      this.logger.error(err.message);
    });

    connection.on('reconnectFailed', async (err: Error) => {
      await this.sendErrorToTelegram('🟩 MongoDB - Reconnect falied');
      this.logger.error('Reconnect to Mongodb falied', err);
      process.exit(1);
    });
  }

  private async sendErrorToTelegram(title: string, error?: any): Promise<void> {
    if (!this.systemNotify) return;
    return this.systemNotify.sendErrorToTelegram(title, error);
  }
}
