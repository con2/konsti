import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { saveSerials } from 'server/features/serial/serialService';

jest.mock('generate-serial-number');

let mongoServer: MongoMemoryServer;

const options = {
  promiseLibrary: global.Promise,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

beforeEach(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri, options);
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Serial service', () => {
  it('should insert new serial into collection', async () => {
    const result = await saveSerials(1);
    expect(result.length).toEqual(1);
    expect(result[0].serial).toEqual('a1234');
  });
  it('should not insert same serial into collection when creating', async () => {
    const savedSerials = await saveSerials(4);
    const results = savedSerials.map((serial) => serial.serial);
    expect(results.length).toEqual(4);
    expect(results).toEqual(['a1234', 'b5225', 'c2512', 'd1232']);
  });
  it('should not insert same serial into collection if the serial is in a collection', async () => {
    // save the first serial into the collection
    await saveSerials(1);
    const savedSerials = await saveSerials(4);
    const results = savedSerials.map((serial) => serial.serial);
    expect(results.length).toEqual(4);
    expect(results).toEqual(['b5225', 'c2512', 'd1232', 'e12039']);
  });
});
