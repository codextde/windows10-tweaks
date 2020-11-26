import { HomeComponent } from './components/home/home.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BackupPageModule } from './pages/backup/backup.module';
import { BackuprestorePageModule } from './pages/backuprestore/backuprestore.module';
import { InventarPageModule } from './pages/inventar/inventar.module';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'backuprestore',
    loadChildren: () => BackuprestorePageModule,
  },
  {
    path: 'inventar',
    loadChildren: () => InventarPageModule,
  },
  {
    path: 'backup',
    loadChildren: () => BackupPageModule,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
