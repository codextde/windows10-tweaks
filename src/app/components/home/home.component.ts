import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Plugins } from '@capacitor/core';
import {
  LoadingController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { ClearRecentlyAccessdFilesScript } from './../../../@codext/scripts/1_clear-recently-accessd-files.script';
import { EndScript } from './../../../@codext/scripts/end.script';
import { InitialScript } from './../../../@codext/scripts/initial.script';
import { CommandService } from './../../services/command.service';

const { Filesystem } = Plugins;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  scripts: any;
  constructor(
    private navCtrl: NavController,
    private command: CommandService,
    private toastCtrl: ToastController,
    private http: HttpClient,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    await this.loadScripts();
  }

  async loadScripts() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    this.scripts = await this.http
      .get('https://api.windows10-tweaks.codext.de/scripts')
      .toPromise();
    console.log(this.scripts);
    loading.dismiss();
  }

  async runRemoteScript(script) {
    return new Promise<boolean | string>(async (resolve, reject) => {
      script.loading = true;
      console.log(script.script);

      try {
        const fullScript =
          InitialScript.script + script.script + EndScript.script;
        await this.command.batch(fullScript);
        const toast = await this.toastCtrl.create({
          message: 'Auftrag erfolgreich ausgeführt',
          duration: 4000,
        });
        toast.present();
        resolve(true);
      } catch (error) {
        const toast = await this.toastCtrl.create({
          message: 'Fehler beim ausführen des Auftrags',
          duration: 4000,
        });
        toast.present();
        resolve(error);
      } finally {
        script.loading = false;
      }
    });
  }

  start() {
    this.asyncForEach(this.scripts, async (script) => {
      if (script.isChecked) {
        await this.runRemoteScript(script);
        script.isChecked = false;
        script.isDone = true;
      }
    });
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  goTo(url) {
    this.navCtrl.navigateRoot(url);
  }
}
