export enum CardCategory {
    HAZARD = 'hazard',
    REMEDY = 'remedy',
    SAFETY = 'safety',
    DISTANCE = 'distance',
    SPEED_LIMIT = 'speed_limit'
}

export enum CardType {
    // Hazards
    ACCIDENT = 'accident',
    OUT_OF_GAS = 'out_of_gas',
    FLAT_TIRE = 'flat_tire',
    SPEED_LIMIT = 'speed_limit',
    STOP = 'stop',
    
    // Remedies
    REPAIRS = 'repairs',
    GASOLINE = 'gasoline',
    SPARE_TIRE = 'spare_tire',
    END_OF_LIMIT = 'end_of_limit',
    ROLL = 'roll',
    
    // Safety
    DRIVING_ACE = 'driving_ace',
    FUEL_TANK = 'fuel_tank',
    PUNCTURE_PROOF = 'puncture_proof',
    RIGHT_OF_WAY = 'right_of_way',
    
    // Distance
    DISTANCE_25 = 'distance_25',
    DISTANCE_50 = 'distance_50',
    DISTANCE_75 = 'distance_75',
    DISTANCE_100 = 'distance_100',
    DISTANCE_200 = 'distance_200'
}

export type CardEffect = CardType;

export interface Card {
    id: string;
    type: CardType;
    category: CardCategory;
    value?: number; // For distance cards
    name: string;
    description: string;
    imageUrl?: string;
}