import { Module } from '@nestjs/common';
import { BluetoothService } from './bluetooth.service';
import { BluetoothController } from './bluetooth.controller';

@Module({
  imports: [],
  controllers: [BluetoothController],
  providers: [BluetoothService],
  exports: [],
})
export class BluetoothModule {}
