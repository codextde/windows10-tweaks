import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BackupPageRoutingModule } from './backup-routing.module';

import { BackupPage } from './backup.page';
import { BackupConfigComponent } from './components/backup-config/backup-config.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, BackupPageRoutingModule],
  declarations: [BackupPage, BackupConfigComponent],
  entryComponents: [BackupConfigComponent],
})
export class BackupPageModule {}
