import { EVCategory } from '@/types';
import { getCollectionDocs, setDocument } from './firestore';

export interface CatalogManufacturer {
  id: string;
  name: string;
  logoUrl?: string;
  country: string;
  category: EVCategory | string;
  popular: boolean;
  active: boolean;
  models: CatalogModel[];
}

export interface CatalogModel {
  id: string;
  manufacturer: string;
  modelName: string;
  variant: string;
  batteryCapacitykWh: number;
  usableCapacitykWh: number;
  ratedRangeKm: number;
  realWorldRangeKm: number;
  dcMaxPowerKW: number;
  acMaxPowerKW: number;
  connectorTypes: string[];
  energyEfficiencyWhPerKm: number;
  vehicleCategory: EVCategory | string;
  statusMetadata?: string;
  active?: boolean;
  verificationStatus?: 'approved' | 'pending' | 'rejected';
  image?: string;
}

const VEHICLE_CATALOG_COLLECTION = 'vehicle_catalog';

// Master Firestore EV Catalog Across Indian & International Manufacturers
export const INITIAL_MANUFACTURERS: CatalogManufacturer[] = [
  {
    id: 'mfg-tata-motors',
    name: 'Tata Motors',
    country: 'India',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-tata-nexon-ev-lr',
        manufacturer: 'Tata Motors',
        modelName: 'Nexon EV Long Range',
        variant: 'Empowered+ Lux 45',
        batteryCapacitykWh: 45.0,
        usableCapacitykWh: 43.2,
        ratedRangeKm: 489,
        realWorldRangeKm: 345,
        dcMaxPowerKW: 60.0,
        acMaxPowerKW: 7.2,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 130,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Verified Production 2026',
      },
      {
        id: 'mod-tata-nexon-ev-mr',
        manufacturer: 'Tata Motors',
        modelName: 'Nexon EV Medium Range',
        variant: 'Fearless+ 30',
        batteryCapacitykWh: 30.0,
        usableCapacitykWh: 28.5,
        ratedRangeKm: 325,
        realWorldRangeKm: 240,
        dcMaxPowerKW: 50.0,
        acMaxPowerKW: 7.2,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 125,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Verified Production 2026',
      },
      {
        id: 'mod-tata-curvv-ev',
        manufacturer: 'Tata Motors',
        modelName: 'Curvv EV',
        variant: 'Empowered+ A 55',
        batteryCapacitykWh: 55.0,
        usableCapacitykWh: 52.8,
        ratedRangeKm: 585,
        realWorldRangeKm: 425,
        dcMaxPowerKW: 70.0,
        acMaxPowerKW: 7.2,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 128,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Verified Production 2026',
      },
      {
        id: 'mod-tata-punch-ev',
        manufacturer: 'Tata Motors',
        modelName: 'Punch EV',
        variant: 'Empowered+ 35',
        batteryCapacitykWh: 35.0,
        usableCapacitykWh: 33.5,
        ratedRangeKm: 421,
        realWorldRangeKm: 290,
        dcMaxPowerKW: 50.0,
        acMaxPowerKW: 7.2,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 120,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Verified Production 2026',
      },
      {
        id: 'mod-tata-tiago-ev',
        manufacturer: 'Tata Motors',
        modelName: 'Tiago EV',
        variant: 'XZ+ Tech Lux 24',
        batteryCapacitykWh: 24.0,
        usableCapacitykWh: 23.0,
        ratedRangeKm: 315,
        realWorldRangeKm: 220,
        dcMaxPowerKW: 50.0,
        acMaxPowerKW: 7.2,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 110,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Verified Production 2026',
      },
      {
        id: 'mod-tata-tigor-ev',
        manufacturer: 'Tata Motors',
        modelName: 'Tigor EV',
        variant: 'XZ+ Lux 26',
        batteryCapacitykWh: 26.0,
        usableCapacitykWh: 24.8,
        ratedRangeKm: 315,
        realWorldRangeKm: 230,
        dcMaxPowerKW: 25.0,
        acMaxPowerKW: 3.3,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 112,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Verified Production 2026',
      },
      {
        id: 'mod-tata-ace-ev',
        manufacturer: 'Tata Motors',
        modelName: 'Ace EV',
        variant: 'Standard Cargo Box',
        batteryCapacitykWh: 21.3,
        usableCapacitykWh: 20.0,
        ratedRangeKm: 154,
        realWorldRangeKm: 140,
        dcMaxPowerKW: 25.0,
        acMaxPowerKW: 3.3,
        connectorTypes: ['CCS2', '15A Plug'],
        energyEfficiencyWhPerKm: 135,
        vehicleCategory: 'commercial',
        statusMetadata: 'Commercial Delivery Van',
      },
    ],
  },
  {
    id: 'mfg-mg-motor',
    name: 'MG Motor',
    country: 'United Kingdom / China',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-mg-zs-ev',
        manufacturer: 'MG Motor',
        modelName: 'ZS EV',
        variant: 'Exclusive Pro 50.3 kWh',
        batteryCapacitykWh: 50.3,
        usableCapacitykWh: 48.0,
        ratedRangeKm: 461,
        realWorldRangeKm: 360,
        dcMaxPowerKW: 60.0,
        acMaxPowerKW: 7.4,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 138,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Verified Production 2026',
      },
      {
        id: 'mod-mg-windsor-ev',
        manufacturer: 'MG Motor',
        modelName: 'Windsor EV',
        variant: 'Essence 38 kWh',
        batteryCapacitykWh: 38.0,
        usableCapacitykWh: 36.5,
        ratedRangeKm: 331,
        realWorldRangeKm: 260,
        dcMaxPowerKW: 45.0,
        acMaxPowerKW: 7.4,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 125,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'CUV Platform 2026',
      },
      {
        id: 'mod-mg-comet-ev',
        manufacturer: 'MG Motor',
        modelName: 'Comet EV',
        variant: 'Exclusive FC 17.3 kWh',
        batteryCapacitykWh: 17.3,
        usableCapacitykWh: 16.5,
        ratedRangeKm: 230,
        realWorldRangeKm: 160,
        dcMaxPowerKW: 0.0,
        acMaxPowerKW: 7.4,
        connectorTypes: ['Type2'],
        energyEfficiencyWhPerKm: 105,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Urban Micro-EV',
      },
      {
        id: 'mod-mg-cyberster',
        manufacturer: 'MG Motor',
        modelName: 'Cyberster',
        variant: 'GT AWD 77 kWh',
        batteryCapacitykWh: 77.0,
        usableCapacitykWh: 74.0,
        ratedRangeKm: 580,
        realWorldRangeKm: 450,
        dcMaxPowerKW: 144.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 165,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Electric Roadster 2026',
      },
    ],
  },
  {
    id: 'mfg-mahindra-electric',
    name: 'Mahindra Electric',
    country: 'India',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-mahindra-xuv400',
        manufacturer: 'Mahindra Electric',
        modelName: 'XUV400 EV',
        variant: 'EL Pro 39.4 kWh',
        batteryCapacitykWh: 39.4,
        usableCapacitykWh: 38.0,
        ratedRangeKm: 456,
        realWorldRangeKm: 310,
        dcMaxPowerKW: 50.0,
        acMaxPowerKW: 7.2,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 132,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Verified Production 2026',
      },
      {
        id: 'mod-mahindra-be6e',
        manufacturer: 'Mahindra Electric',
        modelName: 'BE 6e',
        variant: 'Pack 1 79 kWh',
        batteryCapacitykWh: 79.0,
        usableCapacitykWh: 76.0,
        ratedRangeKm: 682,
        realWorldRangeKm: 520,
        dcMaxPowerKW: 175.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 148,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'INGLO Platform 2026',
      },
      {
        id: 'mod-mahindra-xev9e',
        manufacturer: 'Mahindra Electric',
        modelName: 'XEV 9e',
        variant: 'Pack 1 79 kWh',
        batteryCapacitykWh: 79.0,
        usableCapacitykWh: 76.0,
        ratedRangeKm: 656,
        realWorldRangeKm: 500,
        dcMaxPowerKW: 175.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 152,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'INGLO Platform 2026',
      },
      {
        id: 'mod-mahindra-treo',
        manufacturer: 'Mahindra Electric',
        modelName: 'Treo Auto',
        variant: 'SVR Passenger',
        batteryCapacitykWh: 7.37,
        usableCapacitykWh: 7.0,
        ratedRangeKm: 130,
        realWorldRangeKm: 110,
        dcMaxPowerKW: 0.0,
        acMaxPowerKW: 1.5,
        connectorTypes: ['15A Plug'],
        energyEfficiencyWhPerKm: 55,
        vehicleCategory: '3-wheeler',
        statusMetadata: 'Urban Passenger Rickshaw',
      },
    ],
  },
  {
    id: 'mfg-hyundai',
    name: 'Hyundai',
    country: 'South Korea',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-hyundai-ioniq5',
        manufacturer: 'Hyundai',
        modelName: 'Ioniq 5',
        variant: 'RWD 72.6kWh',
        batteryCapacitykWh: 72.6,
        usableCapacitykWh: 70.0,
        ratedRangeKm: 631,
        realWorldRangeKm: 480,
        dcMaxPowerKW: 240.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 145,
        vehicleCategory: '4-wheeler',
        statusMetadata: '800V E-GMP Architecture',
      },
      {
        id: 'mod-hyundai-creta-ev',
        manufacturer: 'Hyundai',
        modelName: 'Creta Electric',
        variant: 'Long Range 45 kWh',
        batteryCapacitykWh: 45.0,
        usableCapacitykWh: 43.0,
        ratedRangeKm: 470,
        realWorldRangeKm: 350,
        dcMaxPowerKW: 80.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 128,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Production 2026',
      },
    ],
  },
  {
    id: 'mfg-kia',
    name: 'Kia Motors',
    country: 'South Korea',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-kia-ev6',
        manufacturer: 'Kia Motors',
        modelName: 'EV6',
        variant: 'GT-Line AWD 77.4 kWh',
        batteryCapacitykWh: 77.4,
        usableCapacitykWh: 74.0,
        ratedRangeKm: 708,
        realWorldRangeKm: 500,
        dcMaxPowerKW: 240.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 150,
        vehicleCategory: '4-wheeler',
        statusMetadata: '800V Ultra-Fast Charging',
      },
      {
        id: 'mod-kia-ev9',
        manufacturer: 'Kia Motors',
        modelName: 'EV9',
        variant: 'GT-Line 99.8 kWh',
        batteryCapacitykWh: 99.8,
        usableCapacitykWh: 96.0,
        ratedRangeKm: 680,
        realWorldRangeKm: 540,
        dcMaxPowerKW: 210.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 180,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Flagship 7-Seater EV',
      },
    ],
  },
  {
    id: 'mfg-byd',
    name: 'BYD',
    country: 'China',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-byd-atto3',
        manufacturer: 'BYD',
        modelName: 'Atto 3',
        variant: 'Extended Range 60.48 kWh',
        batteryCapacitykWh: 60.48,
        usableCapacitykWh: 58.0,
        ratedRangeKm: 521,
        realWorldRangeKm: 390,
        dcMaxPowerKW: 80.0,
        acMaxPowerKW: 7.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 140,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'BYD Blade Battery Pack',
      },
      {
        id: 'mod-byd-seal',
        manufacturer: 'BYD',
        modelName: 'Seal EV',
        variant: 'Performance AWD 82.56 kWh',
        batteryCapacitykWh: 82.56,
        usableCapacitykWh: 80.0,
        ratedRangeKm: 650,
        realWorldRangeKm: 510,
        dcMaxPowerKW: 150.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 150,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'BYD Blade Battery Pack',
      },
      {
        id: 'mod-byd-e6',
        manufacturer: 'BYD',
        modelName: 'e6 MPV',
        variant: 'GLX 71.7 kWh',
        batteryCapacitykWh: 71.7,
        usableCapacitykWh: 69.0,
        ratedRangeKm: 520,
        realWorldRangeKm: 415,
        dcMaxPowerKW: 60.0,
        acMaxPowerKW: 6.6,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 165,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Electric Passenger MPV',
      },
    ],
  },
  {
    id: 'mfg-bmw',
    name: 'BMW',
    country: 'Germany',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-bmw-i4',
        manufacturer: 'BMW',
        modelName: 'i4',
        variant: 'eDrive40 83.9 kWh',
        batteryCapacitykWh: 83.9,
        usableCapacitykWh: 80.7,
        ratedRangeKm: 590,
        realWorldRangeKm: 520,
        dcMaxPowerKW: 205.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 158,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Luxury Electric Gran Coupe',
      },
      {
        id: 'mod-bmw-ix',
        manufacturer: 'BMW',
        modelName: 'iX',
        variant: 'xDrive50 111.5 kWh',
        batteryCapacitykWh: 111.5,
        usableCapacitykWh: 105.2,
        ratedRangeKm: 630,
        realWorldRangeKm: 570,
        dcMaxPowerKW: 195.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 190,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Flagship Luxury SUV',
      },
    ],
  },
  {
    id: 'mfg-mercedes',
    name: 'Mercedes-Benz',
    country: 'Germany',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-mercedes-eqa',
        manufacturer: 'Mercedes-Benz',
        modelName: 'EQA',
        variant: '250+ 70.5 kWh',
        batteryCapacitykWh: 70.5,
        usableCapacitykWh: 66.5,
        ratedRangeKm: 560,
        realWorldRangeKm: 440,
        dcMaxPowerKW: 100.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 155,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Luxury Compact SUV',
      },
      {
        id: 'mod-mercedes-eqs',
        manufacturer: 'Mercedes-Benz',
        modelName: 'EQS',
        variant: '580 4MATIC 107.8 kWh',
        batteryCapacitykWh: 107.8,
        usableCapacitykWh: 107.8,
        ratedRangeKm: 857,
        realWorldRangeKm: 670,
        dcMaxPowerKW: 200.0,
        acMaxPowerKW: 22.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 165,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Ultra-Luxury Flagship Sedan',
      },
    ],
  },
  {
    id: 'mfg-ather-energy',
    name: 'Ather Energy',
    country: 'India',
    category: '2-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-ather-450x',
        manufacturer: 'Ather Energy',
        modelName: '450X Gen 3',
        variant: '3.7 kWh Pro Pack',
        batteryCapacitykWh: 3.7,
        usableCapacitykWh: 3.5,
        ratedRangeKm: 150,
        realWorldRangeKm: 110,
        dcMaxPowerKW: 3.3,
        acMaxPowerKW: 0.8,
        connectorTypes: ['Ather Fast', '15A Plug'],
        energyEfficiencyWhPerKm: 32,
        vehicleCategory: '2-wheeler',
        statusMetadata: 'Ather Grid Enabled',
      },
      {
        id: 'mod-ather-rizta',
        manufacturer: 'Ather Energy',
        modelName: 'Rizta Z',
        variant: '3.7 kWh Family Scooter',
        batteryCapacitykWh: 3.7,
        usableCapacitykWh: 3.5,
        ratedRangeKm: 159,
        realWorldRangeKm: 120,
        dcMaxPowerKW: 3.3,
        acMaxPowerKW: 0.8,
        connectorTypes: ['Ather Fast', '15A Plug'],
        energyEfficiencyWhPerKm: 30,
        vehicleCategory: '2-wheeler',
        statusMetadata: 'Ather Grid Enabled',
      },
    ],
  },
  {
    id: 'mfg-ola-electric',
    name: 'Ola Electric',
    country: 'India',
    category: '2-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-ola-s1-pro',
        manufacturer: 'Ola Electric',
        modelName: 'S1 Pro Gen 2',
        variant: '4.0 kWh Pack',
        batteryCapacitykWh: 4.0,
        usableCapacitykWh: 3.8,
        ratedRangeKm: 195,
        realWorldRangeKm: 140,
        dcMaxPowerKW: 4.0,
        acMaxPowerKW: 0.75,
        connectorTypes: ['Ola Hypercharger', '15A Plug'],
        energyEfficiencyWhPerKm: 30,
        vehicleCategory: '2-wheeler',
        statusMetadata: 'Hypercharger Network',
      },
      {
        id: 'mod-ola-roadster',
        manufacturer: 'Ola Electric',
        modelName: 'Roadster Pro',
        variant: '16 kWh Performance Motorcycle',
        batteryCapacitykWh: 16.0,
        usableCapacitykWh: 15.0,
        ratedRangeKm: 579,
        realWorldRangeKm: 420,
        dcMaxPowerKW: 12.0,
        acMaxPowerKW: 3.3,
        connectorTypes: ['Type2', '15A Plug'],
        energyEfficiencyWhPerKm: 38,
        vehicleCategory: '2-wheeler',
        statusMetadata: 'Performance Electric Motorcycle',
      },
    ],
  },
  {
    id: 'mfg-tvs-motor',
    name: 'TVS Motor',
    country: 'India',
    category: '2-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-tvs-iqube',
        manufacturer: 'TVS Motor',
        modelName: 'iQube ST',
        variant: '5.1 kWh Pack',
        batteryCapacitykWh: 5.1,
        usableCapacitykWh: 4.8,
        ratedRangeKm: 150,
        realWorldRangeKm: 115,
        dcMaxPowerKW: 1.5,
        acMaxPowerKW: 0.95,
        connectorTypes: ['15A Plug'],
        energyEfficiencyWhPerKm: 34,
        vehicleCategory: '2-wheeler',
        statusMetadata: 'SmartXonnect Connectivity',
      },
    ],
  },
  {
    id: 'mfg-bajaj-auto',
    name: 'Bajaj Auto',
    country: 'India',
    category: '2-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-bajaj-chetak',
        manufacturer: 'Bajaj Auto',
        modelName: 'Chetak Premium',
        variant: '3.2 kWh Pack',
        batteryCapacitykWh: 3.2,
        usableCapacitykWh: 3.0,
        ratedRangeKm: 126,
        realWorldRangeKm: 108,
        dcMaxPowerKW: 1.0,
        acMaxPowerKW: 0.8,
        connectorTypes: ['15A Plug'],
        energyEfficiencyWhPerKm: 30,
        vehicleCategory: '2-wheeler',
        statusMetadata: 'Metal Body Commuter',
      },
    ],
  },
  {
    id: 'mfg-hero-vida',
    name: 'Hero MotoCorp (Vida)',
    country: 'India',
    category: '2-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-hero-vida-v1',
        manufacturer: 'Hero MotoCorp (Vida)',
        modelName: 'Vida V1 Pro',
        variant: '3.94 kWh Removable Pack',
        batteryCapacitykWh: 3.94,
        usableCapacitykWh: 3.7,
        ratedRangeKm: 165,
        realWorldRangeKm: 110,
        dcMaxPowerKW: 2.5,
        acMaxPowerKW: 0.8,
        connectorTypes: ['Ather Fast', '15A Plug'],
        energyEfficiencyWhPerKm: 33,
        vehicleCategory: '2-wheeler',
        statusMetadata: 'Removable Dual Battery',
      },
    ],
  },
  {
    id: 'mfg-citroen',
    name: 'Citroën',
    country: 'France',
    category: '4-wheeler',
    popular: false,
    active: true,
    models: [
      {
        id: 'mod-citroen-ec3',
        manufacturer: 'Citroën',
        modelName: 'ë-C3',
        variant: 'Shine 29.2 kWh',
        batteryCapacitykWh: 29.2,
        usableCapacitykWh: 28.0,
        ratedRangeKm: 320,
        realWorldRangeKm: 245,
        dcMaxPowerKW: 30.0,
        acMaxPowerKW: 3.3,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 115,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'Urban Electric Hatchback',
      },
    ],
  },
  {
    id: 'mfg-maruti-suzuki',
    name: 'Maruti Suzuki',
    country: 'Japan / India',
    category: '4-wheeler',
    popular: true,
    active: true,
    models: [
      {
        id: 'mod-maruti-e-vitara',
        manufacturer: 'Maruti Suzuki',
        modelName: 'e VITARA',
        variant: 'Dual Motor AWD 61 kWh',
        batteryCapacitykWh: 61.0,
        usableCapacitykWh: 58.5,
        ratedRangeKm: 500,
        realWorldRangeKm: 430,
        dcMaxPowerKW: 120.0,
        acMaxPowerKW: 11.0,
        connectorTypes: ['CCS2', 'Type2'],
        energyEfficiencyWhPerKm: 135,
        vehicleCategory: '4-wheeler',
        statusMetadata: 'AllGrip e-AWD Architecture',
      },
    ],
  },
];

class VehicleCatalogService {
  private cache: CatalogManufacturer[] | null = null;

  /**
   * Fetches all manufacturers dynamically from Firestore vehicle_catalog collection.
   * Auto-seeds INITIAL_MANUFACTURERS if Firestore collection is empty.
   */
  async getManufacturers(): Promise<CatalogManufacturer[]> {
    if (this.cache && this.cache.length > 0) return this.cache;

    try {
      const docs = await getCollectionDocs<CatalogManufacturer>(VEHICLE_CATALOG_COLLECTION);
      if (docs && docs.length >= 10) {
        this.cache = docs;
        return docs;
      }
      
      // Auto-seed missing manufacturers to Firestore
      for (const mfg of INITIAL_MANUFACTURERS) {
        await setDocument(VEHICLE_CATALOG_COLLECTION, mfg.id, mfg, true);
      }
    } catch (err) {
      console.warn('[VehicleCatalogService] Firestore read fallback:', err);
    }

    this.cache = INITIAL_MANUFACTURERS;
    return INITIAL_MANUFACTURERS;
  }

  /**
   * Fetches manufacturers filtered by category, popular status, search query, or sorting.
   */
  async queryManufacturers(filters: {
    category?: string;
    popularOnly?: boolean;
    search?: string;
    sortBy?: 'name' | 'popular';
  }): Promise<CatalogManufacturer[]> {
    let list = await this.getManufacturers();

    if (filters.category && filters.category !== 'all') {
      const catNorm = filters.category.replace('_', '-');
      list = list.filter(
        m => m.category === filters.category || m.category === catNorm || m.models.some(mod => mod.vehicleCategory === filters.category || mod.vehicleCategory === catNorm)
      );
    }

    if (filters.popularOnly) {
      list = list.filter(m => m.popular);
    }

    if (filters.search && filters.search.trim() !== '') {
      const query = filters.search.toLowerCase().trim();
      list = list.filter(
        m =>
          m.name.toLowerCase().includes(query) ||
          m.country.toLowerCase().includes(query) ||
          m.models.some(mod => mod.modelName.toLowerCase().includes(query) || mod.variant.toLowerCase().includes(query))
      );
    }

    if (filters.sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }

  /**
   * Adds or updates a manufacturer document dynamically in Firestore.
   */
  async saveManufacturer(mfg: CatalogManufacturer): Promise<boolean> {
    const success = await setDocument(VEHICLE_CATALOG_COLLECTION, mfg.id, mfg);
    if (success) this.cache = null; // Invalidate local cache
    return success;
  }
}

export const vehicleCatalogService = new VehicleCatalogService();
