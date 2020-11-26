import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import * as cpy from 'cpy';
import * as path from 'path';
import {
  mkdirSync,
  createWriteStream,
  createReadStream,
  copySync,
} from 'fs-extra';
import { ncp } from 'ncp';
import { ToastrService } from 'ngx-toastr';
import { BackupService } from './../../services/backup.service';
import { ElectronService } from './../../services/electron.service';
import { HelperService } from './../../services/helper.service';
import { BackupConfigComponent } from './components/backup-config/backup-config.component';
// import * as schedule from 'node-schedule';
import * as archiver from 'archiver';
import * as rimraf from 'rimraf';

import { CronJob } from 'cron';
@Component({
  selector: 'backup',
  templateUrl: './backup.page.html',
  styleUrls: ['./backup.page.scss'],
})
export class BackupPage implements OnInit {
  copyOptionsNcp = {
    stopOnErr: false,
    clobber: true,
    dereference: false,
  };
  mode = 'tasks';

  history = [];
  /*
  progress: cpy.ProgressData = {
    completedFiles: 0,
    totalFiles: 0,
    completedSize: 0,
    percent: 0
  };*/

  constructor(
    private electronService: ElectronService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private helperService: HelperService,
    private modalCtrl: ModalController,
    public backupService: BackupService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.backupService.loadTasks();
    this.backupService.loadHistory();
    if (this.backupService.backupTasks) {
      this.backupService.backupTasks.forEach((task) => {
        if (task.cronExpression) {
          var job = new CronJob(
            task.cronExpression,
            () => {
              this.save(task);
            },
            null,
            true,
            'Europe/Berlin'
          );
          job.start();

          /*
          const scheduleTask: ScheduledTask = schedule(
            task.cronExpression,
            () => {
              this.save(task);
            }
          );
          task.start();
          schedule.scheduleJob(task.cronExpression, () => {
            this.save(task);
          });*/
        }
      });
    }
  }
  segmentChanged(ev) {
    this.mode = ev.detail.value;
  }
  async delete(task) {
    try {
      await this.helperService.confirmDelete();
      this.backupService.removeTask(task);
    } catch (error) {}
  }

  async change(task) {
    let modal = await this.modalCtrl.create({
      component: BackupConfigComponent,
      componentProps: { task: task },
    });
    modal.present();
  }

  async newBackupTask() {
    let modal = await this.modalCtrl.create({
      component: BackupConfigComponent,
    });
    modal.present();
  }

  async save(task) {
    const id = this.electronService.remote.powerSaveBlocker.start(
      'prevent-app-suspension'
    );

    // tslint:disable-next-line: no-unused-expression
    new Notification('Easy File Backup', {
      body: 'Automatisches Backup wird nun ausgeführt',
      silent: true,
    });

    let errors = [];

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const minute = (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();

    const date = `efb_${dd}.${mm}.${yyyy}_${today.getHours()}_${minute}`;

    const source = task.source + '\\';
    const backupDest = task.sync ? task.dest : task.dest + '\\' + date + '\\';
    const fileDest = backupDest + '\\files\\';

    try {
      await mkdirSync(fileDest, { recursive: true });

      let files = [];
      files.push('**/*');
      task.lockedOutFiles.forEach((element) => {
        files.push('!' + element.value);
      });

      await cpy(files, fileDest, {
        parents: true,
        cwd: source,
        overwrite: task.overwrite,
        ignoreJunk: true,
      }).on('progress', (progress) => {
        task.progress = progress;
        this.cdr.detectChanges();
      });
      this.helperService.showToast('Backup wurde erstellt!');

      // tslint:disable-next-line: no-unused-expression
      new Notification('Easy File Backup', {
        body: 'Automatisches Backup erfolgreich abgeschlossen',
        silent: true,
      });

      this.cdr.detectChanges();
    } catch (err) {
      errors.push(err);
      console.log(err);

      this.helperService.showToast(
        'Backup wurde mit Fehler erstellt!',
        'warning'
      );
      //this.electronService.presentAlert('Fehler beim Backup. <br><br>' + err);
    } finally {
      if (task.zip) {
        let loading = await this.loadingCtrl.create({
          message: 'Zip wird erstellt.',
        });
        loading.present();
        const output = createWriteStream(
          path.resolve(backupDest, 'backup.zip')
        );
        const archive = archiver('zip', {
          zlib: { level: 9 },
        });

        output.on('close', () => {
          console.log(archive.pointer() + ' total bytes');
          console.log(
            'archiver has been finalized and the output file descriptor has closed.'
          );
          loading.dismiss();
          console.log(rimraf);
          rimraf(fileDest, {}, () => {});
        });

        output.on('end', () => {
          console.log('Data has been drained');
        });

        archive.on('warning', (err) => {
          if (err.code === 'ENOENT') {
            // log warning
          } else {
            // throw error
            throw err;
          }
        });

        archive.on('error', (err) => {
          throw err;
        });

        archive.pipe(output);
        archive.glob('**', {
          cwd: source,
          ignore: task.lockedOutFiles,
        });

        archive.finalize();
      }

      setTimeout(() => {
        if (task && task.progress && task.progress.percent)
          task.progress.percent = 1;
        this.cdr.detectChanges();
      }, 1000);

      let finishedTask = {
        date: new Date(),
        task,
        errors,
        progress: task.progress,
      };

      this.backupService.addHistory(finishedTask);
      if (errors.length) {
        this.electronService.presentAlert(
          'Fehler beim Backup. <br><br>' + errors
        );
      }

      console.log(finishedTask);

      this.electronService.remote.powerSaveBlocker.stop(id);
    }
  }

  copy(src, dest, opt) {
    return new Promise(async (resolve, reject) => {
      await mkdirSync(dest, { recursive: true });

      ncp(src, dest, opt, (err) => {
        resolve();
      });
    });
  }
}
