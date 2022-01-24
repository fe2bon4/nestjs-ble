import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Post,
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
}
