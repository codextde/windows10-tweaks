import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  clientId: number;
  apiUrl: string = 'http://erlsrv45.gentex.com/src/jsonrpc.php';
  apiKey: string = '5bf7_Z{lC{}^]7*0';

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa('api.user:lyvinence')
    })
  };

  constructor(private httpClient: HttpClient) {}

  async setModelData(
    pcname,
    model: {
      manufacturer?;
      title?;
      productid?;
      service_tag?;
      serial?;
      firmware?;
      description?;
    }
  ) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      const modelData = {
        jsonrpc: '2.0',
        method: 'cmdb.category.save',
        params: {
          object: pcId,
          category: 'C__CATG__MODEL',
          data: model,
          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let data = await this.httpClient
        .post(this.apiUrl, modelData, this.httpOptions)
        .toPromise();
      resolve(data);
    });
  }

  async setCatsClient(
    pcname,
    model: {
      type?;
      keyboard_layout?;
      description?;
    }
  ) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      const modelData = {
        jsonrpc: '2.0',
        method: 'cmdb.category.save',
        params: {
          object: pcId,
          category: 'C__CATS__CLIENT',
          data: model,
          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let data = await this.httpClient
        .post(this.apiUrl, modelData, this.httpOptions)
        .toPromise();
      resolve(data);
    });
  }

  async setOperatingSystem(pcname, operatingsystemtitle) {
    const pcId = await this.getClientId(pcname);
    let operatingSystemId;

    // Check If Operation System Already Exsists
    const operatingSystems = {
      jsonrpc: '2.0',
      method: 'cmdb.objects.read',
      params: {
        filter: {
          type_title: 'LC__OBJTYPE__OPERATING_SYSTEM'
        },
        apikey: this.apiKey,
        language: 'en'
      },
      id: 2
    };

    let operatingSystemsResponse: any = await this.httpClient
      .post(this.apiUrl, operatingSystems, this.httpOptions)
      .toPromise();

    let operatingSystem = operatingSystemsResponse.result.filter(
      operatingSystem => {
        return operatingsystemtitle == operatingSystem.title;
      }
    );

    if (operatingSystem.length > 0) {
      operatingSystemId = operatingSystem[0].id;
    } else {
      // Create new Operating System
      const newOperatingSystem = {
        jsonrpc: '2.0',
        method: 'cmdb.object.create',
        params: {
          category: 'C__CATG__OPERATING_SYSTEM',
          type: 35,
          title: operatingsystemtitle,
          property: 'application_type',
          apikey: this.apiKey,
          language: 'en'
        },
        id: 2
      };

      let newOPResponse: any = await this.httpClient
        .post(this.apiUrl, newOperatingSystem, this.httpOptions)
        .toPromise();
      operatingSystemId = newOPResponse.result.id;
    }

    const opData = {
      jsonrpc: '2.0',
      method: 'cmdb.category.save',
      params: {
        object: pcId,
        category: 'C__CATG__OPERATING_SYSTEM',
        data: {
          application: operatingSystemId
        },

        apikey: this.apiKey,
        language: 'de'
      },
      id: 2
    };

    return await this.httpClient
      .post(this.apiUrl, opData, this.httpOptions)
      .toPromise();
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async deleteDisks(pcname) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      let getDisks = {
        jsonrpc: '2.0',
        method: 'cmdb.category.read',
        params: {
          objID: pcId,
          category: 'C__CATG__STORAGE_DEVICE',
          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let disksResponse: any = await this.httpClient
        .post(this.apiUrl, getDisks, this.httpOptions)
        .toPromise();

      this.asyncForEach(disksResponse.result, async element => {
        let purge = {
          jsonrpc: '2.0',
          method: 'cmdb.category.purge',
          params: {
            object: pcId,
            category: 'C__CATG__STORAGE_DEVICE',
            entry: element.id,
            apikey: this.apiKey,
            language: 'de'
          },
          id: 2
        };

        await this.httpClient
          .post(this.apiUrl, purge, this.httpOptions)
          .toPromise();
      });

      resolve();
    });
  }

  async addDisk(pcname, disk) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      if (!disk.Size) {
        reject('Keine Festplatten erkannt');
      }

      const nA = {
        jsonrpc: '2.0',
        method: 'cmdb.category.save',
        params: {
          object: pcId,
          category: 'C__CATG__STORAGE_DEVICE',
          data: {
            type: disk.MediaType,
            title: disk.FriendlyName,
            model: disk.Model,
            manufacturer: disk.Manufacturer,
            capacity: disk.Size / 1024 / 1024 / 1024,
            unit: 'GB',
            description: 'Zustand: ' + disk.HealthStatus,
            serial: disk.SerialNumber
          },

          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let data = await this.httpClient
        .post(this.apiUrl, nA, this.httpOptions)
        .toPromise();
      resolve(data);
    });
  }

  async deleteCpus(pcname) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      let getCpus = {
        jsonrpc: '2.0',
        method: 'cmdb.category.read',
        params: {
          objID: pcId,
          category: 'C__CATG__CPU',
          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let cpusResponse: any = await this.httpClient
        .post(this.apiUrl, getCpus, this.httpOptions)
        .toPromise();

      this.asyncForEach(cpusResponse.result, async element => {
        let purge = {
          jsonrpc: '2.0',
          method: 'cmdb.category.purge',
          params: {
            object: pcId,
            category: 'C__CATG__CPU',
            entry: element.id,
            apikey: this.apiKey,
            language: 'de'
          },
          id: 2
        };

        await this.httpClient
          .post(this.apiUrl, purge, this.httpOptions)
          .toPromise();
      });

      resolve();
    });
  }

  async addCpu(
    pcname,
    cpu: {
      title?;
      manufacturer?;
      type?;
      frequency?;
      frequency_unit?;
      cores?;
      description?;
    }
  ) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      const nA = {
        jsonrpc: '2.0',
        method: 'cmdb.category.save',
        params: {
          object: pcId,
          category: 'C__CATG__CPU',
          data: cpu,
          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let data = await this.httpClient
        .post(this.apiUrl, nA, this.httpOptions)
        .toPromise();
      resolve(data);
    });
  }

  async deleteNetworkAdapter(pcname) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      let getNetworkAdapter = {
        jsonrpc: '2.0',
        method: 'cmdb.category.read',
        params: {
          objID: pcId,
          category: 'C__CATG__NETWORK_PORT',
          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let networkAdapterResponse: any = await this.httpClient
        .post(this.apiUrl, getNetworkAdapter, this.httpOptions)
        .toPromise();

      this.asyncForEach(networkAdapterResponse.result, async element => {
        let purge = {
          jsonrpc: '2.0',
          method: 'cmdb.category.purge',
          params: {
            object: pcId,
            category: 'C__CATG__NETWORK_PORT',
            entry: element.id,
            apikey: this.apiKey,
            language: 'de'
          },
          id: 2
        };

        await this.httpClient
          .post(this.apiUrl, purge, this.httpOptions)
          .toPromise();
      });

      resolve();
    });
  }

  addNetworkAdapter(
    pcname,
    networkAdapter: {
      name;
      interfaceDescription;
      mac;
    }
  ) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      const nA = {
        jsonrpc: '2.0',
        method: 'cmdb.category.save',
        params: {
          object: pcId,
          category: 'C__CATG__NETWORK_PORT',
          data: {
            title: networkAdapter.interfaceDescription,
            port_type: networkAdapter.name,
            mac: networkAdapter.mac
          },

          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let data = await this.httpClient
        .post(this.apiUrl, nA, this.httpOptions)
        .toPromise();
      resolve(data);
    });
  }

  async deleteMemory(pcname) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      let getMemory = {
        jsonrpc: '2.0',
        method: 'cmdb.category.read',
        params: {
          objID: pcId,
          category: 'C__CATG__MEMORY',
          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let memoryResponse: any = await this.httpClient
        .post(this.apiUrl, getMemory, this.httpOptions)
        .toPromise();

      this.asyncForEach(memoryResponse.result, async element => {
        let purge = {
          jsonrpc: '2.0',
          method: 'cmdb.category.purge',
          params: {
            object: pcId,
            category: 'C__CATG__MEMORY',
            entry: element.id,
            apikey: this.apiKey,
            language: 'de'
          },
          id: 2
        };

        await this.httpClient
          .post(this.apiUrl, purge, this.httpOptions)
          .toPromise();
      });

      resolve();
    });
  }

  addMemory(
    pcname,
    memory: {
      total_capacity?;
      capacity?;
      unit?;
      title?;
      manufacturer?;
      type?;
      description?;
    }
  ) {
    return new Promise(async (resolve, reject) => {
      let pcId;

      try {
        pcId = await this.getClientId(pcname);
      } catch (err) {
        reject(err);
      }

      const nA = {
        jsonrpc: '2.0',
        method: 'cmdb.category.save',
        params: {
          object: pcId,
          category: 'C__CATG__MEMORY',
          data: memory,

          apikey: this.apiKey,
          language: 'de'
        },
        id: 2
      };

      let data = await this.httpClient
        .post(this.apiUrl, nA, this.httpOptions)
        .toPromise();
      resolve(data);
    });
  }

  getClientId(pcname) {
    return new Promise(async (resolve, reject) => {
      console.log('this.clientId', this.clientId);
      if (this.clientId) {
        resolve(this.clientId);
        return;
      }
      const searchClient = {
        jsonrpc: '2.0',
        method: 'idoit.search',
        params: {
          type: 'C__OBJTYPE__CLIENT',
          q: pcname,
          apikey: this.apiKey
        },
        id: 1
      };

      let resp: any = await this.httpClient
        .post(this.apiUrl, searchClient, this.httpOptions)
        .toPromise();

      if (resp && resp.result[0] && resp.result[0].value == pcname) {
        let clientId = parseInt(resp.result[0].documentId);
        this.clientId = clientId;
        resolve(clientId);
      } else {
        reject({ error: 'client not found' });
      }
    });
  }

  addClient(pcname) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa('api.user:lyvinence')
      })
    };

    const data = {
      version: '2.0',
      method: 'cmdb.object.create',
      params: {
        id: 1130,
        type: 'C__OBJTYPE__CLIENT',
        title: pcname,
        apikey: this.apiKey,
        language: 'de'
      },
      id: 1
    };
    console.log(data);

    this.httpClient.post(this.apiUrl, data, httpOptions).subscribe(() => {});
  }

  calcSize(size) {
    return (size / 1024 / 1024 / 1024).toFixed();
  }
}
