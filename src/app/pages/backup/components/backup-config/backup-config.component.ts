import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { readdirSync } from 'fs-extra';
import { HelperService } from '../../../../services/helper.service';
import { ElectronService } from './../../../../services/electron.service';

import { BackupService } from '../../../../services/backup.service';
import { CronOptions } from 'ngx-cron-editor';

@Component({
  selector: 'backup-config',
  templateUrl: './backup-config.component.html',
  styleUrls: ['./backup-config.component.scss'],
})
export class BackupConfigComponent implements OnInit {
  @Input() task;
  public cronOptions: any | CronOptions = {
    defaultTime: '00:00:00',

    hideMinutesTab: false,
    hideHourlyTab: false,
    hideDailyTab: false,
    hideWeeklyTab: false,
    hideMonthlyTab: false,
    hideYearlyTab: false,
    hideAdvancedTab: false,
    hideSpecificWeekDayTab: true,
    hideSpecificMonthWeekTab: true,

    use24HourTime: true,
    hideSeconds: false,

    cronFlavor: 'standard', //standard or quartz
  };

  correctBackupPath: boolean = false;
  cronExpression: string = '';
  backup = {
    name: '',
    source: null,
    dest: null,
    cronExpression: '0 0 1 1/1 *',
    lockedOutFiles: [],
    sync: false,
    overwrite: false,
    zip: false,
  };
  edit: boolean = false;
  mode = 'general';

  constructor(
    private modalCtrl: ModalController,
    private helperService: HelperService,
    private electronService: ElectronService,
    public backupService: BackupService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    if (this.task) {
      this.backup = this.task;
      this.edit = true;
    }
  }

  segmentChanged(ev) {
    this.mode = ev.detail.value;
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async checkPath() {
    try {
      await readdirSync(this.backup.source);
      this.correctBackupPath = true;
    } catch (err) {
      this.correctBackupPath = false;
    }
  }

  async getDestPath() {
    const path = await this.electronService.remote.dialog.showOpenDialogSync({
      properties: ['openDirectory'],
    });
    if (path[0]) {
      this.backup.dest = path[0];
    }
  }

  async getSourcePath() {
    const path = await this.electronService.remote.dialog.showOpenDialogSync({
      properties: ['openDirectory'],
    });
    if (path[0]) {
      this.backup.source = path[0];
    }
  }

  async createBackup() {
    console.log('this.backup.source', this.backup.source);
    if (!this.backup.source) {
      const toast = await this.toastCtrl.create({
        message: 'Bitte wählen Sie eine Quelle aus',
      });
      toast.present();
      return;
    }
    if (!this.backup.dest) {
      const toast = await this.toastCtrl.create({
        message: 'Bitte wählen Sie ein Ziele aus',
      });
      toast.present();
      return;
    }
    console.log(this.backup);
    if (this.edit) {
      this.backupService.changeTask(this.backup);
    } else {
      this.backupService.addTask(this.backup);
    }
    this.backup = {
      name: '',
      source: null,
      dest: null,
      cronExpression: '0 0 1 1/1 *',
      lockedOutFiles: [],
      sync: false,
      overwrite: false,
      zip: false,
    };
    this.modalCtrl.dismiss();
  }

  delete(lockedOut) {
    this.backup.lockedOutFiles = this.backup.lockedOutFiles.filter(
      (obj) => obj !== lockedOut
    );
  }

  addLockedOutFileEntry() {
    this.backup.lockedOutFiles.push({ value: '*.txt' });
  }
}
