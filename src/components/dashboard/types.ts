export type DashboardTab = 'overview' | 'rooms' | 'devices' | 'energy' | 'automations';

export type RoomFormState = {
  name: string;
  floor: string;
};

export type DeviceFormState = {
  name: string;
  device_type: number;
  room_id: string;
};

export const initialRoomForm: RoomFormState = { name: '', floor: 'Entrance' };

export const initialDeviceForm: DeviceFormState = { name: '', device_type: 0, room_id: '' };
