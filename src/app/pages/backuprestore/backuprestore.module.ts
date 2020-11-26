import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { BackuprestorePage } from './backuprestore.page';

const routes: Routes = [
  {
    path: '',
    component: BackuprestorePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [BackuprestorePage]
})
export class BackuprestorePageModule {}
