export class Geometry {
  public Type!: string;
  public Coordinates!: string;

  public get coords(): string {
    return this.Coordinates;
  }

  public get lon(): number {
    return Number(this.Coordinates.split(',')[0]);
  }

  public get lat(): number {
    return Number(this.Coordinates.split(',')[1]);
  }
}

export interface Country {
  Code: string;
  Name: string;
}

export interface AddressElement {
  Name: string;
  Kana: string;
  Level: 'prefecture' | 'city' | 'oaza' | 'aza';
}
