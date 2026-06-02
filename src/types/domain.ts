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
  room_type?: string | null;
  house_id: string;
  devices?: Device[];
};

export type RoomCreateInput = {
  name: string;
  floor?: string;
  room_type: string;
  house_id: string;
};

export type RoomUpdateInput = {
  room_id: string;
  name?: string;
  floor?: string;
  room_type?: string;
};

export type DeviceCreateInput = {
  name: string;
  device_type: number;
  room_id: string;
};

export type DeviceUpdateInput = {
  device_id: string;
  name?: string;
  room_id?: string;
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
  turn_on: boolean;
  parameters?: Record<string, unknown>;
};

export type AutomationCreateInput = {
  name: string;
  trigger_type: number;
  trigger_value?: string;
  execution_day?: number;
  device_id: string;
  turn_on: boolean;
  parameters?: Record<string, unknown>;
};

export type AutomationUpdateInput = {
  automation_id: string;
  name?: string;
  trigger_type?: number;
  trigger_value?: string;
  execution_day?: number;
  turn_on?: boolean;
  parameters?: Record<string, unknown>;
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

export type EnergyHistoryPoint = {
  hour_slot: string;
  total_estimated_watts?: number;
  active_devices?: number;
  total_devices?: number;
  estimated_watts?: number;
  is_on?: boolean;
};

export type EnergyHistoryResponse = {
  house_id?: string;
  house_name?: string;
  room_id?: string;
  room_name?: string;
  device_id?: string;
  device_name?: string;
  device_type?: number;
  hours: number;
  history: EnergyHistoryPoint[];
  summary?: {
    total_kwh: number;
    estimated_cost: number;
    currency: string;
    rate_per_kwh: number;
  };
};

// ─── Notifications ─────────────────────────────
export type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

// ─── Device Presets ────────────────────────────
export type Preset = {
  id: string;
  name: string;
  brand: string;
  device_type: number;
  description: string;
  parameters: Record<string, unknown>;
};

// ─── Password rules ────────────────────────────
// Mirrors the backend rule: 8–72 chars, at least one lowercase, one uppercase,
// one digit, and one symbol from !@#$%^&*(),.?":{}|<>
export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 72) {
    return 'Password must be between 8 and 72 characters.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one digit.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must include at least one symbol (!@#$%^&*(),.?":{}|<>).';
  }
  return null;
}

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

export const ROOM_TYPE_LABELS: Record<string, string> = {
  living_room: 'Living Room (Sufragerie)',
  kitchen: 'Kitchen (Bucatarie)',
  master_bedroom: 'Master Bedroom (Dormitor Principal)',
  bedroom: 'Bedroom (Dormitor)',
  bathroom: 'Bathroom (Baie)',
  dining_room: 'Dining Room (Loc de luat masa)',
  entrance_hallway: 'Entrance / Hallway (Intrare / Hol)',
  home_office: 'Home Office (Birou)',
  library: 'Library (Biblioteca)',
  laundry_room: 'Laundry Room (Spalatorie)',
  garage: 'Garage (Garaj)',
  storage_room: 'Storage Room / Pantry (Camara / Depozitare)',
  basement: 'Basement (Subsol)',
  attic: 'Attic (Pod)',
  gym: 'Gym (Sala de fitness)',
  home_theater: 'Home Theater (Cinema acasa)',
  game_room: 'Game Room (Camera de jocuri)',
  balcony: 'Balcony (Balcon)',
  terrace: 'Terrace (Terasa)',
  garden: 'Garden (Gradina)',
  backyard: 'Backyard (Curte)',
  pool_area: 'Pool Area (Piscina)',
  other: 'Other (Alta zona)',
};

export type RoomTypeGroup = {
  label: string;
  options: { value: string; label: string }[];
};

export const ROOM_TYPE_GROUPS: RoomTypeGroup[] = [
  {
    label: 'Zone Principale (Core Rooms)',
    options: [
      { value: 'living_room', label: ROOM_TYPE_LABELS.living_room },
      { value: 'kitchen', label: ROOM_TYPE_LABELS.kitchen },
      { value: 'master_bedroom', label: ROOM_TYPE_LABELS.master_bedroom },
      { value: 'bedroom', label: ROOM_TYPE_LABELS.bedroom },
      { value: 'bathroom', label: ROOM_TYPE_LABELS.bathroom },
      { value: 'dining_room', label: ROOM_TYPE_LABELS.dining_room },
      { value: 'entrance_hallway', label: ROOM_TYPE_LABELS.entrance_hallway },
    ],
  },
  {
    label: 'Zone de Lucru si Depozitare',
    options: [
      { value: 'home_office', label: ROOM_TYPE_LABELS.home_office },
      { value: 'library', label: ROOM_TYPE_LABELS.library },
      { value: 'laundry_room', label: ROOM_TYPE_LABELS.laundry_room },
      { value: 'garage', label: ROOM_TYPE_LABELS.garage },
      { value: 'storage_room', label: ROOM_TYPE_LABELS.storage_room },
      { value: 'basement', label: ROOM_TYPE_LABELS.basement },
      { value: 'attic', label: ROOM_TYPE_LABELS.attic },
    ],
  },
  {
    label: 'Zone de Relaxare (Leisure)',
    options: [
      { value: 'gym', label: ROOM_TYPE_LABELS.gym },
      { value: 'home_theater', label: ROOM_TYPE_LABELS.home_theater },
      { value: 'game_room', label: ROOM_TYPE_LABELS.game_room },
      { value: 'balcony', label: ROOM_TYPE_LABELS.balcony },
      { value: 'terrace', label: ROOM_TYPE_LABELS.terrace },
    ],
  },
  {
    label: 'Zone Exterioare (Outdoor)',
    options: [
      { value: 'garden', label: ROOM_TYPE_LABELS.garden },
      { value: 'backyard', label: ROOM_TYPE_LABELS.backyard },
      { value: 'pool_area', label: ROOM_TYPE_LABELS.pool_area },
    ],
  },
  {
    label: 'Altele',
    options: [{ value: 'other', label: ROOM_TYPE_LABELS.other }],
  },
];

export const DEFAULT_ROOM_TYPE = 'other';

export function getRoomTypeLabel(roomType: string | null | undefined): string {
  if (!roomType) {
    return ROOM_TYPE_LABELS[DEFAULT_ROOM_TYPE];
  }

  return ROOM_TYPE_LABELS[roomType] ?? ROOM_TYPE_LABELS[DEFAULT_ROOM_TYPE];
}

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
