export type UserRole = 'Farmer' | 'Admin' | 'Drone Operator';

export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  role: UserRole;
  displayName?: string;
  country?: string;
  region?: string;
  city?: string;
  location?: { lat: number; lng: number };
  units: 'metric' | 'imperial';
  settings?: {
    animatedCursor: boolean;
  };
  createdAt: string;
}

export interface Field {
  fieldId: string;
  farmerId: string;
  name: string;
  boundary?: { lat: number; lng: number }[];
  location: { lat: number; lng: number };
  placeName?: string;
  sizeHectares?: number;
  sizeAcres?: number;
  cropType?: string;
  lastMaintenanceDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ServiceRequest {
  requestId: string;
  farmerId: string;
  serviceType: 'pest control' | 'irrigation' | 'soil test' | 'drone scan';
  details?: string;
  preferredDateTime: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed';
  assignedOperatorId?: string;
  createdAt: string;
}

export interface Drone {
  droneId: string;
  name: string;
  specs?: string;
  status: 'active' | 'maintenance' | 'offline';
  condition?: string;
  battery: number;
  location?: { lat: number; lng: number };
  lastUpdate?: string;
  assignedOperatorId?: string;
  createdAt: string;
}

export interface Alert {
  alertId: string;
  userId: string;
  type: 'weather' | 'drone' | 'service';
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface MarketPrice {
  id: string;
  crop: string;
  region: string;
  price: number;
  currency: string;
  updatedAt: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  icon: string;
}

export interface IntegrationStatus {
  email: boolean;
  sms: boolean;
  weather: boolean;
  maps: boolean;
  market: boolean;
}

export interface AuthLog {
  id: string;
  timestamp: string;
  errorCode: string;
  errorMessage: string;
  email?: string;
  authMode: string;
  domain: string;
}
