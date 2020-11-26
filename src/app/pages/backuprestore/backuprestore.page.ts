import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../services/electron.service';

import { LoadingController, ToastController } from '@ionic/angular';

import { readdir, copySync, readdirSync, mkdirSync } from 'fs-extra';
// import * as copy from 'recursive-copy';

import { ncp } from 'ncp';

@Component({
  selector: 'backuprestore',
  templateUrl: './backuprestore.page.html',
  styleUrls: ['./backuprestore.page.scss']
})
export class BackuprestorePage implements OnInit {
  tasks = [
    {
      title: 'Desktop',
      isChecked: true,
      task: 'desktop'
    },
    {
      title: 'Downloads',
      isChecked: true,
      task: 'downloads'
    },
    {
      title: 'Dokumente',
      isChecked: true,
      task: 'documents'
    },
    {
      title: 'Videos',
      isChecked: true,
      task: 'videos'
    },
    {
      title: 'Favoriten',
      isChecked: true,
      task: 'favorites'
    },
    {
      title: 'Firefox Profil',
      isChecked: true,
      task: 'firefox'
    }
  ];

  profiles = [];
  profile: string;
  backuppath: string = 'Y:\\temp\\backup';
  restorepath: string = 'Y:\\temp\\backup';

  selectedBackup;

  mode = 'backup';

  backups: { profile: string; date: string }[] = [];

  copyOptions = {
    overwrite: true,
    errorOnExist: false,
    dereference: false
  };

  copyOptionsRC = {
    overwrite: true,
    expand: false,
    dot: true
  };

  copyOptionsNcp = {
    stopOnErr: false,
    clobber: true,
    dereference: false
  };

  correctBackupPath: boolean = false;

  constructor(
    public electronService: ElectronService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.getProfileFolders();
    this.loadBackups();
    this.checkPath();
  }

  backupSelect(ev) {
    console.log(ev.detail.value);
    this.selectedBackup = ev.detail.value;
    this.checkPath();
  }

  async checkPath() {
    try {
      await readdirSync(this.backuppath);
      this.correctBackupPath = true;
    } catch (err) {
      this.correctBackupPath = false;
    }
  }

  async restore() {
    let loading = await this.loadingCtrl.create({
      message: 'Backup wird wiederhergestellt ...'
    });
    loading.present();

    let restorePath = this.electronService.path.join(
      this.restorepath,
      this.selectedBackup.date,
      this.selectedBackup.profile
    );
    const homedir = this.electronService.os.homedir;
    const tasks = await readdir(restorePath);

    try {
      await this.electronService.asyncForEach(tasks, async task => {
        console.log(task);
        if (task == 'Desktop') {
          const src = restorePath + '\\Desktop\\';
          const dest = homedir + '\\Desktop\\';
          await this.copy(src, dest, this.copyOptionsNcp);
        }

        if (task == 'Downloads') {
          const src = restorePath + '\\Downloads\\';
          const dest = homedir + '\\Downloads\\';
          await this.copy(src, dest, this.copyOptionsNcp);
        }

        if (task == 'Videos') {
          const src = restorePath + '\\Videos\\';
          const dest = homedir + '\\Videos\\';
          await this.copy(src, dest, this.copyOptionsNcp);
        }

        if (task == 'Favorites') {
          const src = restorePath + '\\Favorites\\';
          const dest = homedir + '\\Favorites\\';
          await this.copy(src, dest, this.copyOptionsNcp);
        }

        if (task == 'Documents') {
          const src = restorePath + '\\Documents\\';
          const dest = homedir + '\\Documents\\';
          await this.copy(src, dest, this.copyOptionsNcp);
        }

        if (task == 'Firefox') {
          const src = restorePath + '\\Firefox\\';
          const dest = `${homedir}\\AppData\\Local\\Mozilla\\Firefox\\Profiles\\`;
          await this.copy(src, dest, this.copyOptionsNcp);
        }
      });
    } catch (err) {
      console.log(err);
      this.electronService.presentAlert(
        'Fehler beim Wiederherstellen vom Backup. <br><br>' + err
      );
    }

    loading.dismiss();
  }

  async loadBackups() {
    try {
      const dates = await this.electronService.fs.readdirSync(this.restorepath);

      dates.forEach(async date => {
        console.log(date);
        if (date.startsWith('gb_')) {
          const profiles = await this.electronService.fs.readdirSync(
            this.electronService.path.join(this.restorepath, date)
          );
          profiles.forEach(profile => {
            if (profile && date) {
              this.backups.push({
                profile: profile,
                date: date
              });
            }
          });
        }
      });
    } catch (err) {
      console.log('No Folders found');
    }
  }

  segmentChanged(ev) {
    this.mode = ev.detail.value;
  }
  async getRestorePath() {
    const path = await this.electronService.remote.dialog.showOpenDialogSync({
      properties: ['openDirectory']
    });
    if (path[0]) {
      this.restorepath = path[0];
      this.loadBackups();
    }
  }

  async getBackupPath() {
    const path = await this.electronService.remote.dialog.showOpenDialogSync({
      properties: ['openDirectory']
    });
    if (path[0]) {
      this.backuppath = path[0];
      this.checkPath();
    }
  }

  getProfileFolders() {
    const directoryPath = 'C:\\Users'; //this.electronService.path.join('',"Documents");
    this.electronService.fs.readdir(directoryPath, (err, files) => {
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }
      files.forEach(file => {
        this.profiles.push(file);
      });
    });
  }

  async showToast(message) {
    let toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'middle'
    });
    toast.present();
  }

  async save() {
    let loading = await this.loadingCtrl.create({
      message: 'Backup wird erstellt ...'
    });
    loading.present();

    setTimeout(async () => {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();

      const date = `gb_${dd}.${mm}.${yyyy}_${today.getHours()}.${today.getMinutes()}`;
      const backupPathDate =
        this.backuppath + '\\' + date + '\\' + this.profile;

      try {
        await this.electronService.asyncForEach(this.tasks, async task => {
          if (task.isChecked) {
            if (task.task == 'desktop') {
              const src = 'C:\\Users\\' + this.profile + '\\Desktop';
              const dest = backupPathDate + '\\Desktop';
              await this.copy(src, dest, this.copyOptionsNcp);
            }

            if (task.task == 'downloads') {
              const src = 'C:\\Users\\' + this.profile + '\\Downloads';
              const dest = backupPathDate + '\\Downloads';
              await this.copy(src, dest, this.copyOptionsNcp);
            }

            if (task.task == 'videos') {
              const src = 'C:\\Users\\' + this.profile + '\\Videos';
              const dest = backupPathDate + '\\Videos';
              await this.copy(src, dest, this.copyOptionsNcp);
            }

            if (task.task == 'favorites') {
              const src = 'C:\\Users\\' + this.profile + '\\Favorites';
              const dest = backupPathDate + '\\Favorites';
              await this.copy(src, dest, this.copyOptionsNcp);
            }

            if (task.task == 'documents') {
              const src = 'C:\\Users\\' + this.profile + '\\Documents\\';
              const dest = backupPathDate + '\\Documents\\';
              await this.copy(src, dest, this.copyOptionsNcp);
            }

            if (task.task == 'firefox') {
              const src = `C:\\Users\\${this.profile}\\AppData\\Local\\Mozilla\\Firefox\\Profiles\\`;
              const dest = `${backupPathDate}\\Firefox\\`;
              await this.copy(src, dest, this.copyOptionsNcp);
            }
          }
        });
        this.loadBackups();
        this.showToast('Backup wurde erstellt!');
      } catch (err) {
        console.log(err);
        this.electronService.presentAlert('Fehler beim Backup. <br><br>' + err);
      }
      loading.dismiss();
    }, 100);

    /*await cpy("foo.js", "destination", {
      rename: basename => `prefix-${basename}`
    });*/
  }

  copy(src, dest, opt) {
    return new Promise(async (resolve, reject) => {
      await mkdirSync(dest, { recursive: true });

      ncp(src, dest, opt, err => {
        resolve();
      });
    });
  }
}
