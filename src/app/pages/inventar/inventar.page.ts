import { HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import * as powershell from 'node-powershell';
import * as sudo from 'sudo-prompt';
import { ClientService } from '../../services/client.service';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'inventar',
  templateUrl: './inventar.page.html',
  styleUrls: ['./inventar.page.scss']
})
export class InventarPage implements OnInit {
  disk: any = {};
  cpu: any = {};
  memory: any = {};
  deviceType: 'Laptop' | 'PC';
  computerData: any = [
    {
      displayValue: 'Computername',
      key: 'CsName'
    },
    {
      displayValue: 'Domain',
      key: 'CsDomain'
    },
    {
      displayValue: 'Manufactur',
      key: 'CsManufacturer'
    },
    {
      displayValue: 'Benutzername',
      key: 'CsUserName'
    },
    {
      displayValue: 'OS Name',
      key: 'OsName'
    },
    {
      displayValue: 'Buildnummer',
      key: 'OsBuildNumber'
    },
    {
      displayValue: 'Organization',
      key: 'OsOrganization'
    },
    {
      displayValue: 'Architecture',
      key: 'OsArchitecture'
    },
    {
      displayValue: 'Logon Server',
      key: 'LogonServer'
    }
  ];

  loading: boolean = false;
  loadingElm: any;
  client: any = {};
  ComputerInfo: any = {};

  networkAdapter: any = [];

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa('api.user:lyvinence')
    })
  };

  constructor(
    private toastCtrl: ToastController,
    public electronService: ElectronService,
    public clientService: ClientService,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    this.loadingElm = await this.loadingCtrl.create({
      message: 'Daten werden geladen'
    });
    this.loadingElm.present();

    this.loading = true;

    console.log('running');
    this.electronService.childProcess.exec('echo test', (err, data, stderr) => {
      console.log('error', err, data, stderr);
    });
    this.electronService.childProcess.exec(
      'winrm quickconfig -q',
      (err, data, stderr) => {
        console.log('error', err, data, stderr);
        if (data.includes('bereits') || data.includes('already')) {
          this.loadData();
        } else {
          this.presentToast('WMI wird aktiviert');
          sudo.exec(
            'winrm quickconfig -quiet -force',
            {
              name: 'iDoItInventar'
            },
            async (error, stdout, stderr) => {
              console.log('error', error, stdout, stderr);
              if (error) {
                this.electronService.presentAlert(
                  "WMI konnte nicht aktiviert werden. Bitte folgenden Befehlt in der CMD als Admin ausführen: 'winrm quickconfig -quiet -force'. Fehler: " +
                    error
                );
                this.loading = false;
                return;
              }
              if (!stdout.includes('bereits') || !data.includes('already')) {
                // this.electronService.presentAlert(stdout);
              }
              this.loadData();
            }
          );
        }
      }
    );
  }

  async loadData() {
    Promise.all([
      this.getIsLaptop(),
      this.getCPUInfo(),
      this.getDiskInfo(),
      this.refreshPCInfo(),
      this.getNetworkAdapter(),
      this.getMemory()
    ]).then(async () => {
      if (this.electronService.upload) {
        await this.sendToIDoIt();
        let myNotification = new Notification('Info', {
          body: 'Daten für iDoIt wurden erfolgreich aktualisiert!'
        });

        myNotification.onclick = () => {
          console.log('Notification clicked');
        };

        this.electronService.close();
      }

      this.loadingElm.dismiss();
      this.loading = false;
    });
  }

  async presentToast(message) {
    let toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'middle'
    });
    await toast.present();
  }

  getMemory() {
    return new Promise((resolve, reject) => {
      const command = `
        $PysicalMemory = Get-WmiObject -class "win32_physicalmemory" -namespace "root\\CIMV2" -ComputerName "localhost"
        $PysicalMemory | ConvertTo-Json
      `;
      this.executePowershell(command)
        .then(async output => {
          this.memory = JSON.parse(output);
          console.log(this.memory);
          resolve();
        })
        .catch(async err => {
          let toast = await this.toastCtrl.create({
            message: 'Fehler beim laden',
            duration: 3000,
            position: 'middle'
          });
          toast.present();

          this.electronService.presentAlert(err);
          reject();
        });
    });
  }

  getIsLaptop() {
    return new Promise((resolve, reject) => {
      const command = `
      Function Detect-Laptop
      {
        Param( [string]$computer = "localhost" )
        $isLaptop = $false
        if(Get-WmiObject -Class win32_systemenclosure -ComputerName $computer | Where-Object { $_.chassistypes -eq 9 -or $_.chassistypes -eq 10 -or $_.chassistypes -eq 14})
        { $isLaptop = $true }

        if(Get-WmiObject -Class win32_battery -ComputerName $computer)
        { $isLaptop = $true }
        $isLaptop
      }

      Detect-Laptop;
      `;
      this.executePowershell(command)
        .then(async output => {
          this.deviceType = output.includes('True') ? 'Laptop' : 'PC';
          resolve();
        })
        .catch(async err => {
          let toast = await this.toastCtrl.create({
            message: 'Fehler beim laden',
            duration: 3000,
            position: 'middle'
          });
          toast.present();

          this.electronService.presentAlert(err);
          reject();
        });
    });
  }

  async refreshPCInfo(loading: boolean = true) {
    return new Promise((resolve, reject) => {
      loading ? (this.loading = true) : null;
      const command = 'Get-ComputerInfo  | ConvertTo-Json';
      this.executePowershell(command)
        .then(async output => {
          this.client = JSON.parse(output);
          console.log(this.client);
          loading ? (this.loading = false) : null;
          let toast = await this.toastCtrl.create({
            message: 'Allgemeine PC Info geladen',
            duration: 3000,
            position: 'middle'
          });
          toast.present();
          resolve();
        })
        .catch(async err => {
          loading ? (this.loading = false) : null;

          let toast = await this.toastCtrl.create({
            message: 'Fehler beim laden',
            position: 'middle',

            duration: 3000
          });
          toast.present();

          this.electronService.presentAlert(err);
          reject();
        });
    });
  }

  async getNetworkAdapter(loading: boolean = true) {
    return new Promise((resolve, reject) => {
      loading ? (this.loading = true) : null;
      const command = 'Get-NetAdapter | ConvertTo-Json';
      this.executePowershell(command)
        .then(async output => {
          let networkCards = JSON.parse(output);

          networkCards.forEach(network => {
            this.networkAdapter.push({
              name: network.InterfaceAlias,
              interfaceDescription: network.DriverDescription,
              mac: network.MacAddress
            });
          });

          let toast = await this.toastCtrl.create({
            message: 'Netzwerkkarten geladen',
            duration: 3000,
            position: 'middle'
          });
          toast.present();
          resolve();
        })
        .catch(async err => {
          let toast = await this.toastCtrl.create({
            message: 'Fehler beim laden',
            duration: 3000,
            position: 'middle'
          });
          toast.present();

          this.electronService.presentAlert(err);
          reject();
        });
    });
  }

  getDiskInfo() {
    return new Promise((resolve, reject) => {
      this.executePowershell('Get-PhysicalDisk  | ConvertTo-Json')
        .then(diskInfo => {
          let disks = JSON.parse(diskInfo);
          let sataDisk;
          if (Array.isArray(disks)) {
            sataDisk = disks.find(disk => {
              return disk.DeviceId == 0;
            });
            this.disk = sataDisk;
            resolve();
            return;
          } else if (disks.DeviceId == 0) {
            this.disk = disks;
            resolve();
            return;
          }

          this.presentToast('Festplatte konnte nicht ermittelt werden.');
          this.disk = null;
        })
        .catch(err => {
          this.electronService.presentAlert(err);
        });
    });
  }

  getCPUInfo() {
    return new Promise((resolve, reject) => {
      this.executePowershell('Get-WmiObject win32_processor | ConvertTo-Json')
        .then(output => {
          this.cpu = JSON.parse(output);

          this.cpu['Manufacturer'] = this.cpu['Manufacturer'].replace(
            'GenuineIntel',
            'Intel'
          );
          resolve();
        })
        .catch(err => {
          this.electronService.presentAlert(err);
        });
    });
  }

  executePowershell(command) {
    const ps = new powershell({
      executionPolicy: 'Bypass',
      noProfile: true
    });

    ps.addCommand(command);
    return ps.invoke();
  }

  async sendToIDoIt() {
    return new Promise(async (resolve, reject) => {
      if (!this.electronService.upload) {
        await this.electronService
          .presentAlert(`Folgende Daten werden übertragen: <br>
    Seriennummer: ${this.client['BiosSeralNumber']}<br>
    Hersteller: ${this.client['CsManufacturer']}<br>
    Modell: ${this.client['CsSystemFamily']}<br>
    Betriebssystem: ${this.client['OsName']}<br>


    <br><br>
    <strong>Speicher</strong><br>
    Speicher:  ${(this.disk.Size / 1024 / 1024 / 1024).toFixed()}<br>
    Mout Punkt: ${this.disk.BusType}<br>
    Name: ${this.disk.FriendlyName}<br>
    Beschreibung: Zustand: ${this.disk.HealthStatus}<br>
    Seriennummer: ${this.disk.SerialNumber}<br>
    `);
      }

      const loading = await this.loadingCtrl.create();
      loading.present();

      // Update Serialnumber
      if (this.client['BiosSeralNumber']) {
        try {
          await this.clientService.setModelData(this.client['CsName'], {
            serial: this.client['BiosSeralNumber']
            // manufacturer: this.client['CsManufacturer']
            //title: this.client['CsSystemFamily']
          });
        } catch (err) {
          loading.dismiss();
          let toast = await this.toastCtrl.create({
            message: 'PC nicht gefunden. Bitte vorher in iDoIt anlegen.',
            duration: 3000,
            position: 'middle'
          });
          toast.present();
        }
      }

      try {
        if (this.client['CsManufacturer'] && this.client['CsSystemFamily']) {
          await this.clientService.setModelData(this.client['CsName'], {
            manufacturer: this.client['CsManufacturer'],
            title: this.client['CsSystemFamily']
          });
        }

        if (this.deviceType) {
          await this.clientService.setCatsClient(this.client['CsName'], {
            type: this.deviceType
          });
        }

        if (this.memory) {
          await this.clientService.deleteMemory(this.client['CsName']);
          this.clientService.asyncForEach(this.memory, async memory => {
            await this.clientService.addMemory(this.client['CsName'], {
              capacity: (memory['Capacity'] / 1024 / 1024 / 1024).toFixed(),
              title: memory['Name'],
              manufacturer: memory['Manufacturer'],
              unit: 'GB',
              description: `
            Seriennummer: ${memory['SerialNumber']}
            Speed: ${memory['Speed']}
            `
            });
          });
        }

        if (this.cpu['Name']) {
          await this.clientService.deleteCpus(this.client['CsName']);
          await this.clientService.addCpu(this.client['CsName'], {
            title: this.cpu['Name'],
            manufacturer: this.cpu['Manufacturer'],
            type: this.cpu['Name'],
            frequency: (this.cpu['MaxClockSpeed'] / 1000).toFixed(1),
            frequency_unit: 'GHz',
            cores: this.cpu['NumberOfCores'],
            description: this.cpu['Description']
          });
        }

        // Update System
        if (this.client['OsName']) {
          await this.clientService.setOperatingSystem(
            this.client['CsName'],
            this.client['OsName']
          );
        }

        // Update Disk
        await this.clientService.deleteDisks(this.client['CsName']);
        if (this.disk) {
          await this.clientService.addDisk(this.client['CsName'], this.disk);
        }

        // Update Network
        if (this.networkAdapter.length > 0) {
          let wifi = this.networkAdapter.find(adapter => {
            return adapter.name == 'Wi-Fi';
          });
          let ethernet = this.networkAdapter.find(adapter => {
            return adapter.name == 'Ethernet';
          });

          await this.clientService.deleteNetworkAdapter(this.client['CsName']);

          if (wifi) {
            await this.clientService.addNetworkAdapter(
              this.client['CsName'],
              wifi
            );
          }
          if (ethernet) {
            await this.clientService.addNetworkAdapter(
              this.client['CsName'],
              ethernet
            );
          }
        }

        let toast = await this.toastCtrl.create({
          message: 'Erfolgreich übertragen',
          duration: 2000,
          position: 'middle'
        });
        toast.present();
        loading.dismiss();
        resolve();
      } catch (error) {
        this.presentToast('Fehler beim anlegen. ' + error);
        loading.dismiss();
        reject();
      }
    });
  }
}
