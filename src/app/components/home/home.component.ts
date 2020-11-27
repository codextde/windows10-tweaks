import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { NavController, ToastController } from '@ionic/angular';
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
    private http: HttpClient
  ) {}
  async ngOnInit() {
    await this.loadScripts();
  }

  async loadScripts() {
    this.scripts = await this.http
      .get('http://localhost:1337/scripts')
      .toPromise();
  }

  async runRemoteScript(script) {
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
    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: 'Fehler beim ausführen des Auftrags',
        duration: 4000,
      });
      toast.present();
    } finally {
      script.loading = false;
    }
  }

  goTo(url) {
    this.navCtrl.navigateRoot(url);
  }
}
