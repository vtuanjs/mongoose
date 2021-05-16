import { describe, it, before } from 'mocha';
import { expect } from 'chai';

import { MongoDB, Schema, BaseRepository } from '../src';
import userData from './user.json';

class UserEntity {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const userSchema = new Schema({
  name: String,
  email: String
});

class UserRepository extends BaseRepository<UserEntity> {
  constructor() {
    super('user', userSchema, 'users');
  }
}

// main
const userRepo = new UserRepository();
const user = userData[0];
let findUser: UserEntity = null;

before((done) => {
  const mongodb = new MongoDB({});
  mongodb
    .connect()
    .then(() => done())
    .catch((error) => done(error));
});

describe('CREATE User', () => {
  it('should be return user info', (done) => {
    userRepo
      .create(user)
      .then((result) => {
        expect(result).has.ownProperty('id');
        expect(result.email).to.eqls(user.email);
        expect(result.name).to.eqls(user.name);
        done();
      })
      .catch((err) => done(err));
  });
});

describe('FIND user', () => {
  it('should be found user', (done) => {
    userRepo
      .findOne({ email: user.email })
      .then((result) => {
        expect(result.email).to.eqls(user.email);
        findUser = result;
        done();
      })
      .catch((err) => done(err));
  });
});

describe('FIND MANY user', () => {
  it('should be found list of user', (done) => {
    userRepo
      .findMany({ email: user.email })
      .then((result) => {
        expect(result).to.be.a('array');
        done();
      })
      .catch((err) => done(err));
  });
});

describe('FIND ALL user', () => {
  it('should be found list or user with paging', (done) => {
    userRepo
      .findAll({ email: user.email }, { sort: '-id' })
      .then((result) => {
        expect(result.limit).to.be.a('number');
        expect(result.page).to.be.a('number');
        expect(result.total).to.be.a('number');
        expect(result.totalPages).to.be.a('number');
        expect(result.data).to.be.a('array');
        done();
      })
      .catch((err) => done(err));
  });
});

describe('FIND ONE AND UPDATE user', () => {
  it('should be return updated user', (done) => {
    userRepo
      .findOneAndUpdate({ email: user.email }, { name: 'NVT' })
      .then((result) => {
        expect(result.name).to.eqls('NVT');
        done();
      })
      .catch((err) => done(err));
  });
});

describe('UPDATE user', () => {
  it('should be found users', (done) => {
    userRepo
      .findMany({ email: user.email })
      .then((result) => {
        expect(result).to.be.a('array');
        done();
      })
      .catch((err) => done(err));
  });
});

describe('UPDATE user', () => {
  it('should be updated user', (done) => {
    userRepo
      .updateById(findUser.id, { name: 'Tuan' })
      .then((result) => {
        expect(result).to.eqls(true);
        done();
      })
      .catch((err) => done(err));
  });
});

describe('DELETE user', () => {
  it('should be deleted user', (done) => {
    userRepo
      .deleteById(findUser.id)
      .then((result) => {
        expect(result).to.eqls(true);
        done();
      })
      .catch((err) => done(err));
  });
});
