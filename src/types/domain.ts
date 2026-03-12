export type SmartUser = {
  id: string;
  username: string;
  email: string;
};

export type AuthSession = {
  accessToken: string;
  user: SmartUser;
};

export type House = {
  id: string;
  name: string;
  description: string;
};

export type Device = {
  id: string;
  name: string;
  type: number;
  parameters: Record<string, unknown>;
  room_id: string;
};

export type Room = {
  id: string;
  name: string;
  floor: string;
  house_id: string;
  devices?: Device[];
};

export type RoomCreateInput = {
  name: string;
  floor: string;
  house_id: string;
};

export type RoomUpdateInput = {
  room_id: string;
  name?: string;
  floor?: string;
};

export type DeviceCreateInput = {
  name: string;
  device_type: number;
  room_id: string;
};

export type DeviceUpdateInput = {
  device_id: string;
  name?: string;
  parameters?: Record<string, unknown>;
};

// ─── Automations ───────────────────────────────
export const AUTOMATION_TRIGGER_LABELS: Record<number, string> = {
  [-1]: 'Unknown',
  0: 'Time',
  1: 'Temperature',
  2: 'Lux',
};

export const AUTOMATION_TRIGGER_OPTIONS = Object.entries(AUTOMATION_TRIGGER_LABELS)
  .filter(([key]) => Number(key) >= 0)
  .map(([key, label]) => ({ value: Number(key), label }));

export type Automation = {
  id: string;
  name: string;
  trigger_type: number;
  trigger_value: string | null;
  execution_day: number | null;
  device_id: string;
};

export type AutomationCreateInput = {
  name: string;
  trigger_type: number;
  trigger_value?: string;
  execution_day?: number;
  device_id: string;
};

export type AutomationUpdateInput = {
  automation_id: string;
  name?: string;
  trigger_type?: number;
  trigger_value?: string;
  execution_day?: number;
};

// ─── Energy ────────────────────────────────────
export type DeviceEnergy = {
  device_id: string;
  device_name: string;
  device_type: number;
  is_on: boolean;
  estimated_watts: number;
};

export type HouseholdEnergy = {
  house_id: string;
  house_name: string;
  total_devices: number;
  active_devices: number;
  total_estimated_watts: number;
  devices: DeviceEnergy[];
};

// ─── Notifications ─────────────────────────────
export type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export const DEVICE_TYPE_LABELS: Record<number, string> = {
  0: 'Light',
  1: 'LED Strip',
  2: 'Outlet',
  3: 'Fan',
  4: 'Thermostat',
  5: 'Air Conditioner',
  6: 'Humidifier',
  7: 'Heater',
  8: 'Garage Door',
  9: 'Gate',
  10: 'TV',
  11: 'Speaker',
  12: 'Oven',
  13: 'Dishwasher',
  14: 'Washer',
  15: 'Dryer',
  16: 'Refrigerator',
  17: 'Curtains',
  18: 'Router',
  19: 'Hub',
  20: 'Other',
  [-1]: 'Unknown',
};

export const DEVICE_TYPE_OPTIONS = Object.entries(DEVICE_TYPE_LABELS)
  .filter(([key]) => Number(key) >= 0)
  .map(([key, label]) => ({ value: Number(key), label }));

export const FLOOR_CHOICES = ['Entrance', '1st', '2nd', '3rd', '4th', '5th'];

// ─── Device Parameter Definitions ──────────────
// Describes the UI control for each parameter key, per device type.

export type ParamControl =
  | { kind: 'toggle'; label: string }
  | { kind: 'slider'; label: string; min: number; max: number; step: number; unit?: string }
  | { kind: 'temperature'; label: string; min: number; max: number; step: number; unit: string }
  | { kind: 'color'; label: string }
  | { kind: 'select'; label: string; options: { value: number; label: string }[] };

// Maps device type → ordered param controls (status is always handled separately)
export const DEVICE_PARAM_CONTROLS: Partial<Record<number, ParamControl[]>> = {
  // 1 = LED Strip
  1: [
    { kind: 'color', label: 'Color (RGB)' },
  ],
  // 3 = Fan
  3: [
    { kind: 'slider', label: 'Fan Power', min: 0, max: 100, step: 1, unit: '%' },
  ],
  // 4 = Thermostat
  4: [
    { kind: 'temperature', label: 'Temperature', min: 5, max: 35, step: 0.5, unit: '°C' },
  ],
  // 5 = Air Conditioner
  5: [
    { kind: 'select', label: 'Mode', options: [{ value: 0, label: 'Cool' }, { value: 1, label: 'Heat' }] },
    { kind: 'temperature', label: 'Target Temperature', min: 16, max: 30, step: 0.5, unit: '°C' },
  ],
  // 7 = Heater
  7: [
    { kind: 'temperature', label: 'Target Temperature', min: 5, max: 35, step: 0.5, unit: '°C' },
    { kind: 'slider', label: 'Power', min: 0, max: 100, step: 1, unit: '%' },
  ],
  // 10 = TV
  10: [
    { kind: 'slider', label: 'Volume', min: 0, max: 100, step: 1, unit: '' },
  ],
  // 11 = Speaker
  11: [
    { kind: 'slider', label: 'Volume', min: 0, max: 100, step: 1, unit: '' },
  ],
  // 12 = Oven
  12: [
    { kind: 'slider', label: 'Power Setting', min: 0, max: 10, step: 1, unit: '' },
    { kind: 'temperature', label: 'Target Temperature', min: 50, max: 300, step: 5, unit: '°C' },
  ],
  // 14 = Washer
  14: [
    { kind: 'select', label: 'Wash Type', options: [
      { value: 0, label: 'Normal' }, { value: 1, label: 'Delicate' },
      { value: 2, label: 'Heavy Duty' }, { value: 3, label: 'Quick Wash' },
    ]},
  ],
  // 15 = Dryer
  15: [
    { kind: 'select', label: 'Dry Type', options: [
      { value: 0, label: 'Normal' }, { value: 1, label: 'Delicate' },
      { value: 2, label: 'Heavy Duty' }, { value: 3, label: 'Quick Dry' },
    ]},
  ],
  // 16 = Refrigerator
  16: [
    { kind: 'slider', label: 'Power', min: 0, max: 100, step: 1, unit: '%' },
  ],
};
