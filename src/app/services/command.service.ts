import { ElectronService } from './electron.service';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CommandService {
  constructor(private electron: ElectronService) {}

  batch(script) {
    return new Promise((resolve, reject) => {
      const fs = this.electron.fs;
      const scriptDir = this.electron.path.join(
        this.electron.os.tmpdir(),
        'windows10-tweak-script.bat'
      );

      try {
        fs.writeFileSync(scriptDir, script, 'utf-8');

        const ps = new this.electron.powershell({
          executionPolicy: 'Bypass',
          noProfile: true,
        });

        ps.addCommand(
          `Start-Process cmd -ArgumentList '/c ${scriptDir}' -Verb runas -Wait`
        );
        ps.invoke()
          .then((output) => {
            console.log(output);
            resolve(output);
          })
          .catch((err) => {
            console.log(err);
            reject(err);
          });
      } catch (e) {
        reject(e);
      }
    });
  }
}
