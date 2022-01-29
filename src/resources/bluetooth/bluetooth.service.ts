import { Injectable, Logger } from '@nestjs/common';
import Noble, { Characteristic, Peripheral, Service } from '@abandonware/noble';
import { omit } from 'lodash';

@Injectable()
export class BluetoothService {
  private store: Record<string, any> = {
    state: '',
    services: {},
    peripherals: {},
    peripherals_connected: {},
  };
  private serviceName = 'Noble';
  private noble: typeof Noble = require('@abandonware/noble');
  private messages = []

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
    this.store = {
      ...this.store,
      peripherals: {
        ...this.store.peripherals,
        [peripheral.address]: peripheral,
      },
    };
  }

  public async scan() {
    await this.noble.startScanningAsync([]);
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
          manufacturerData: p.advertisement.manufacturerData?.toString('hex'),
        },
      };
    });
  }

  public async getServices() {
    return Object.keys(this.store.services).map(key => {
      const { 
        uuid,
        name,
        type,
      }: Service = this.store.services[key].service 

      return {
        uuid,
        name,
        type
      }
    })
  }

  public async getServiceCharacteristics(service_id: string) {
    const service = this.store.services[service_id]
    
    if(!service) return []

    return service.characteristics.map( (characteristic: Characteristic) => {
      const { uuid, descriptors, name, properties} = characteristic
      return { uuid, descriptors, name, properties}
    })

  }

  public async writeToCharacteristic({
    service_id,
    characteristic_id,
    payload
  }: any) {
    const service = this.store.services[service_id]

    if(!service) return false

    const characteristic:Characteristic | null = service.characteristics.find(sCharacteristic=> sCharacteristic.uuid === characteristic_id)

    if(!characteristic) return false;


    const bufferedPayload = Buffer.from( JSON.stringify(payload))
    // char

    console.log(payload, bufferedPayload.length)
 
    return new Promise((resolve)=>{
         characteristic.write(bufferedPayload, true,(error) => {
           if(error) {
             resolve(false)
           } resolve(true)
         })
    })
  }

  public async readFromCharacteristic({
    service_id,
    characteristic_id
  }:any) {
    const service = this.store.services[service_id]

    if(!service) {
      Logger.log(`Service ${service_id} not found`, this.serviceName)
      return false
    }

    const characteristic:Characteristic | null = service.characteristics.find(sCharacteristic=> sCharacteristic.uuid === characteristic_id)

    if(!characteristic) return false

    const data = await characteristic.readAsync().then((data:Buffer)=> data.toString());

    try {
      return  JSON.parse(data)
    } catch (e ) {
      return data
    }


  }

  public async subscribeToCharacteristic({}: any) {

  }

  private async onPeripheralConnect(peripheral: Peripheral) {
    Logger.log(`Connected to ${peripheral.address}`, this.serviceName);

    const peripherals_connected = omit(this.store.peripherals_connected, [
      peripheral.address,
    ]);

    this.store = {
      ...this.store,
      peripherals_connected,
    };
    
    await peripheral.discoverAllServicesAndCharacteristicsAsync();
  }

  private async onPeripheralDisconnect(
    address: string,
  ) {
    Logger.log(`Disconnected from ${address}`, this.serviceName);
    this.store = {
      ...this.store,
      services: {}
    };
    this.messages = []
  }

  private onCharacteristicDiscover(peripheral:Peripheral, service:Service, characteristics:Array<Characteristic>) {

    Logger.log(`Populated Characteristics ${service.uuid}:${characteristics.length}`, this.serviceName)

    characteristics.forEach(characteristic => {
      Logger.log(`Sevice [${service.uuid}] characteristic: ${characteristic.uuid}, properties: ${characteristic.properties} `, this.serviceName)
    })

    this.store.services = {
      ...this.store.services,
      [service.uuid]: {
        service,
        characteristics
      }
    }
  }

  private onServiceDiscover(
    peripheral: Peripheral,
    services: Array<Service>,
  ) {
    services.forEach(service => service.on('characteristicsDiscover', this.onCharacteristicDiscover.bind(this, peripheral, service)))
  }

  public async connect(address: string) {
    const peripheral: Peripheral = this.store.peripherals[address];

    peripheral.once('connect', this.onPeripheralConnect.bind(this, peripheral));

    peripheral.once(
      'disconnect',
      this.onPeripheralDisconnect.bind(this, peripheral),
    );
    peripheral.once(
      'servicesDiscover',
      this.onServiceDiscover.bind(this, peripheral),
    );

    return await peripheral.connectAsync();
  }

  public async disconnect(address: string) {
    const peripheral: Peripheral = this.store.peripherals[address];

    if (!peripheral) return;

    return await peripheral.disconnectAsync();
  }

  onModuleInit() {}

  constructor() {
    this.noble.on('scanStart', this.onScanStart.bind(this));
    this.noble.on('scanStop', this.onScanStop.bind(this));
    this.noble.on('stateChange', this.onStateChange.bind(this));
    this.noble.on('discover', this.onDiscover.bind(this));
  }
}
