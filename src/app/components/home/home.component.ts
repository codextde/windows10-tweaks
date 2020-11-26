import { ElectronService } from './../../services/electron.service';
import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
declare var navigator: any;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(
    private navCtrl: NavController,
    private electron: ElectronService
  ) {}
  ngOnInit() {}

  goTo(url) {
    this.navCtrl.navigateRoot(url);
  }
}
