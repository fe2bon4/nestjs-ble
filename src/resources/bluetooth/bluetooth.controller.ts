import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { BluetoothService } from './bluetooth.service';

@Controller('/ble')
export class BluetoothController {
  private scanning = false;

  constructor(private readonly bluetoothService: BluetoothService) {}
  @Post('/scan')
  async scan(@Body('duration_ms') duration_ms = 5000) {
    if (this.scanning)
      return {
        message: 'ok',
      };

    this.scanning = true;

    await this.bluetoothService.scan();

    setTimeout(() => {
      this.scanning = false;
      this.bluetoothService.scanStop();
    }, duration_ms);
    return {
      message: 'ok',
    };
  }

  @Post('/connect')
  async connect(@Body('address') address = '') {
    if (!address) throw new BadRequestException('address is required');

    const peripherals = await this.bluetoothService.getPeripherals();

    const peripheral = peripherals.find((p) => p.address === address);

    if (!peripheral) {
      throw new NotFoundException(
        `Peripheral with addtess ${address} not found.`,
      );
    }

    await this.bluetoothService.connect(address);

    return {
      message: 'ok',
    };
  }

  @Post('/disconnect')
  async disconnect(@Body('address') address = '') {
    if (!address) throw new BadRequestException('address is required');

    await this.bluetoothService.disconnect(address);

    return {
      message: 'ok',
    };
  }

  @Get('/peripherals')
  async getPeripherals() {
    const peripherals = await this.bluetoothService.getPeripherals();
    return {
      message: 'ok',
      entity: 'peripheral',
      payload: peripherals,
    };
  }

   @Get('/services')
  async getServices() {
    const services = await this.bluetoothService.getServices();
    return {
      message: 'ok',
      entity: 'service',
      payload: services,
    };
  }

  @Get('/characteristics/:service_id')
  async getServiceCharactistics(@Param('service_id') service_id) {
    const characteristics = await this.bluetoothService.getServiceCharacteristics(service_id);
    return {
      message: 'ok',
      entity: 'characteristic',
      payload: characteristics,
    };
  }

  @Put('/characteristic/:service_id/:characteristic_id')
  async writeToCharacteristic(
    @Param('service_id') service_id,
    @Param('characteristic_id') characteristic_id,
    @Body() payload) {

    const response = await this.bluetoothService.writeToCharacteristic({
      service_id,
      characteristic_id,
      payload
    })


    return {
      message:'okay',
      payload: response
    }
  }

   @Get('/characteristic/:service_id/:characteristic_id')
  async readFromCharacteristic(
    @Param('service_id') service_id,
    @Param('characteristic_id') characteristic_id)
  {

    const payload = await this.bluetoothService.readFromCharacteristic({
      service_id,
      characteristic_id
    })

    return {
      payload
    }

  }
}
