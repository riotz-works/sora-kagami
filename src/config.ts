// tslint:disable: completed-docs - 'cuz configuration variables
import dayjs from 'dayjs';
import { name, version } from '~/../package.json';
import { Geometry } from '~/external-api/yolp/common';
import { GeoCodeRequest } from '~/external-api/yolp/geo-code';
import { PlaceInfoRequest } from '~/external-api/yolp/place-info';
import { StaticMapRequest } from '~/external-api/yolp/static-map';
import { Weather, WeatherForecastRequest } from '~/external-api/yolp/weather-forecast';
import { ZipCodeRequest } from '~/external-api/yolp/zip-code';


/**
 * Application config definition.
 */
export class Config {

  public static readonly NAME = name;
  public static readonly VERSION = version;

  public static readonly SLACK_INFO_TEXT_LENGTH = 24;

  public static readonly CONTENT_TYPE_MAP = 'image/jpg';

  public static REQUEST_ZIP(query: string): ZipCodeRequest { return { appid, query, detail: 'simple', results: 1 }; }
  public static REQUEST_GEO(query: string): GeoCodeRequest { return { appid, query, category: 'landmark,address,world', results: 1 }; }
  public static REQUEST_PLACE({ lon, lat }: Geometry): PlaceInfoRequest { return { appid, lon, lat }; }
  public static REQUEST_WEATHER({ coords }: Geometry): WeatherForecastRequest { return { appid, coordinates: coords }; }
  public static REQUEST_MAP({ lon, lat }: Geometry): StaticMapRequest {
    return { appid, lon, lat, z: 13, style: 'base:railway', overlay: 'type:rainfall', output: 'jpg', width: 600, height: 600 };
  }

  public static FILENAMES(geo: Geometry, { Date }: Weather): { map: string } {
    const prefix = `${dayjs(Date).toISOString()}-${geo.coords.replace(',', '-')}`;
    return {
      map: `${prefix}-map.jpg`
    };
  }
}


/**
 * Environment variable definition.
 */
export class Env {

  public static get STAGE(): Stage { return process.env.STAGE as Stage || Env.fail('STAGE'); }

  public static get S3_IMAGES_REGION(): string { return process.env.S3_IMAGES_REGION || Env.fail('S3_IMAGES_REGION'); }
  public static get S3_IMAGES_BUCKET(): string { return process.env.S3_IMAGES_BUCKET || Env.fail('S3_IMAGES_BUCKET'); }

  public static get SLACK_TOKENS(): string[] { return JSON.parse(process.env.SLACK_TOKENS || '[]') as string[]; }

  public static get YOLP_APP_ID(): string { return process.env.YOLP_APP_ID || Env.fail('YOLP_APP_ID'); }


  private static fail(envVarName: string): never {
    console.error(`Environment variable "${envVarName}" is not set`);
    throw new Error(`Environment variable "${envVarName}" is not set`);
  }
}

export type Stage = 'dev' | 'qas' | 'prd';

const appid = Env.YOLP_APP_ID;  // 'cuz to use property shorthand in object literal
