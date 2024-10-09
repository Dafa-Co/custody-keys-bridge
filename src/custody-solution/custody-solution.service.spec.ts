import { Test, TestingModule } from '@nestjs/testing';
import { CustodySolutionService } from './custody-solution.service';

describe('CustodySolutionService', () => {
  let service: CustodySolutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustodySolutionService],
    }).compile();

    service = module.get<CustodySolutionService>(CustodySolutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
