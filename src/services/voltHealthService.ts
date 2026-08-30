import { BatteryHealthRecord, MaintenanceRecord, ServiceReminder, HealthAlert } from '@/types';
import { calculateBatteryHealthEstimate } from '@/features/vehicles/utils/calculationEngine';

class VoltHealthService {
  private maintenanceRecords: MaintenanceRecord[] = [
    {
      id: 'maint-01',
      userId: 'demo-driver-101',
      vehicleId: 'veh-01',
      serviceDate: '2026-06-15',
      serviceType: 'periodic_inspection',
      odometerKm: 12500,
      serviceProvider: 'Tata Authorized EV Care — Gachibowli',
      costINR: 2450,
      notes: 'Brake fluid level check, tire rotation, coolant check & BMS software diagnostic update.',
      createdAt: '2026-06-15T10:00:00Z',
    },
  ];

  private serviceReminders: ServiceReminder[] = [
    {
      id: 'rem-01',
      vehicleId: 'veh-01',
      title: 'Periodic 15,000 km Inspection & Battery Coolant Check',
      dueOdometerKm: 15000,
      dueDate: '2026-09-30',
      isCompleted: false,
      createdAt: '2026-06-15T10:00:00Z',
    },
  ];

  private healthRecords: BatteryHealthRecord[] = [];

  /**
   * Retrieves maintenance records for a given vehicle.
   */
  async getMaintenanceRecords(vehicleId: string): Promise<MaintenanceRecord[]> {
    return this.maintenanceRecords.filter(r => r.vehicleId === vehicleId);
  }

  /**
   * Creates a new user maintenance record.
   */
  async addMaintenanceRecord(
    record: Omit<MaintenanceRecord, 'id' | 'createdAt'>
  ): Promise<MaintenanceRecord> {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `maint-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.maintenanceRecords.unshift(newRecord);
    return newRecord;
  }

  /**
   * Retrieves service reminders for a given vehicle.
   */
  async getServiceReminders(vehicleId: string): Promise<ServiceReminder[]> {
    return this.serviceReminders.filter(r => r.vehicleId === vehicleId);
  }

  /**
   * Creates a new service reminder.
   */
  async addServiceReminder(vehicleId: string, title: string, dueOdometerKm?: number, dueDate?: string): Promise<ServiceReminder> {
    const reminder: ServiceReminder = {
      id: `rem-${Date.now()}`,
      vehicleId,
      title,
      dueOdometerKm,
      dueDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    this.serviceReminders.push(reminder);
    return reminder;
  }

  /**
   * Retrieves historical health records or empty array for honest UI empty state.
   */
  async getHealthHistory(vehicleId: string): Promise<BatteryHealthRecord[]> {
    return this.healthRecords.filter(r => r.vehicleId === vehicleId);
  }
}

export const voltHealthService = new VoltHealthService();
