import { Injectable, Logger } from '@nestjs/common';
import Noble, { Peripheral } from '@abandonware/noble';

@Injectable()
export class BluetoothService {
  private store: Record<string, any> = {
    state: '',
    services: [],
    characteristics: [],
    peripherals: {},
  };
  private serviceName = 'Noble';
  private noble: typeof Noble = require('@abandonware/noble');

  private onScanStart() {
    Logger.log('Scan Started', this.serviceName);
  }

  private onScanStop() {
    Logger.log('Scan Stopped', this.serviceName);
  }

  private onStateChange(state: string) {
    Logger.log(`State Changed to ${state}`, this.serviceName);
    this.store = { ...this.store, state };
  }

  private onDiscover(peripheral: Peripheral) {
    if (this.store.peripherals[peripheral.address]) {
      return;
    }

    this.store = {
      ...this.store,
      peripherals: {
        [peripheral.address]: peripheral,
      },
    };
  }

  public async scan() {
    await this.noble.startScanningAsync();
  }

  public async scanStop() {
    Logger.log(
      `Found ${Object.values(this.store.peripherals).length} devices`,
      this.serviceName,
    );
    await this.noble.stopScanningAsync();
  }

  public async getPeripherals() {
    return Object.values(this.store.peripherals).map((p: Peripheral) => {
      return {
        id: p.id,
        uuid: p.uuid,
        address: p.address,
        advertisement: {
          ...p.advertisement,
          manufacturerData: p.advertisement.manufacturerData.toString('hex'),
        },
      };
    });
  }

  onModuleInit() {}

  constructor() {
    this.noble.on('scanStart', this.onScanStart.bind(this));
    this.noble.on('scanStop', this.onScanStop.bind(this));
    this.noble.on('stateChange', this.onStateChange.bind(this));
    this.noble.on('discover', this.onDiscover.bind(this));
  }
}
