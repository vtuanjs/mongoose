import { connection, connect, Mongoose } from 'mongoose';
import { IMongoConfig, ILogger, ISystemNotify } from './definations';

export { Schema, FilterQuery, CreateQuery, UpdateQuery, Document } from 'mongoose';

export class MongoDB {
  logger: ILogger;
  config: IMongoConfig;
  systemNotify: ISystemNotify;

  constructor(param?: { logger?: ILogger; config?: IMongoConfig; systemNotify?: ISystemNotify }) {
    this.logger = param?.logger || console;
    this.config = {
      connectionString: param?.config?.connectionString || 'mongodb://localhost:27017/example',
      user: param?.config?.user || '',
      password: param?.config?.password || ''
    };
    this.systemNotify = param?.systemNotify;
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
