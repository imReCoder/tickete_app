import { Controller, Patch, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller({ path: 'sync', version: '1' })
export class SyncController {
  constructor(private syncService: SyncService) {}
  @Patch('/pause')
  pauseSync(@Query('force') forced = false) {
    return this.syncService.pauseSync(forced);
  }

  @Patch('/resume')
  resumeSync() {
    return this.syncService.resumeSync();
  }
}
