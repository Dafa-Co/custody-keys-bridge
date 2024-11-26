import { Inject } from '@nestjs/common';
import { CURRENT_CORPORATE } from './tenancy.module';

export const InjectCurrentCorporate = () => Inject(CURRENT_CORPORATE);
