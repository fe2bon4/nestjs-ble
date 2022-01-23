import { Body, Controller, Get, Post } from '@nestjs/common';
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
