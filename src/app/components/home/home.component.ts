import { ElectronService } from './../../services/electron.service';
import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
declare var navigator: any;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(
    private navCtrl: NavController,
    private electron: ElectronService
  ) {}
  ngOnInit() {
    /*this.electron.desktopCapturer
      .getSources({ types: ['window', 'screen'] })
      .then(async sources => {
        for (const source of sources) {
          console.log(source);
          if (source.name == 'Screen 1') {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop'
                  }
                }
              });
              this.handleStream(stream);
            } catch (e) {
              console.log(e);
            }
            return;
          }
        }
      });*/
  }

  handleStream(stream) {
    const video = document.querySelector('video');
    video.srcObject = stream;
    video.onloadedmetadata = e => video.play();
  }

  goTo(url) {
    this.navCtrl.navigateRoot(url);
  }
}
