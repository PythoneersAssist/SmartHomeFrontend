export type DashboardTab = 'overview' | 'rooms' | 'devices' | 'favourites' | 'energy' | 'automations';

export type RoomFormState = {
  name: string;
  room_type: string;
};

export type DeviceFormState = {
  name: string;
  device_type: number;
  room_id: string;
  parameters: Record<string, unknown>;
};

export const initialRoomForm: RoomFormState = { name: '', room_type: 'living_room' };

export const initialDeviceForm: DeviceFormState = { name: '', device_type: 0, room_id: '', parameters: {} };
