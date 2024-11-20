import { Test, TestingModule } from '@nestjs/testing';
import { BackupStorageIntegrationService } from './backup-storage-integration.service';

describe('BackupStorageIntegrationService', () => {
  let service: BackupStorageIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BackupStorageIntegrationService],
    }).compile();

    service = module.get<BackupStorageIntegrationService>(BackupStorageIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
