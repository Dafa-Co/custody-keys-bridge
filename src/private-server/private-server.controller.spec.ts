import { Test, TestingModule } from '@nestjs/testing';
import { PrivateServerController } from './private-server.controller';

describe('PrivateServerController', () => {
  let controller: PrivateServerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrivateServerController],
    }).compile();

    controller = module.get<PrivateServerController>(PrivateServerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
