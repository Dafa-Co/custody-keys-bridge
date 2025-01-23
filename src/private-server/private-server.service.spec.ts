import { Test, TestingModule } from '@nestjs/testing';
import { PrivateServerService } from './private-server.service';

describe('PrivateServerService', () => {
  let service: PrivateServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrivateServerService],
    }).compile();

    service = module.get<PrivateServerService>(PrivateServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
