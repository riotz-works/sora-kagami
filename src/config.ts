// tslint:disable: completed-docs - 'cuz configuration variables
import { name, version } from '~/../package.json';
import { Geometry } from '~/external-api/yolp/common';
import { GeoCodeRequest } from '~/external-api/yolp/geo-code';
import { PlaceInfoRequest } from '~/external-api/yolp/place-info';
import { ZipCodeRequest } from '~/external-api/yolp/zip-code';


/**
 * Application config definition.
 */
export class Config {

  public static readonly NAME = name;
  public static readonly VERSION = version;

  public static readonly SLACK_INFO_TEXT_LENGTH = 24;

  public static REQUEST_ZIP(query: string): ZipCodeRequest { return { appid, query, detail: 'simple', results: 1 }; }
  public static REQUEST_GEO(query: string): GeoCodeRequest { return { appid, query, category: 'landmark,address,world', results: 1 }; }
  public static REQUEST_PLACE({ lon, lat }: Geometry): PlaceInfoRequest { return { appid, lon, lat }; }
}


/**
 * Environment variable definition.
 */
export class Env {

  public static get STAGE(): Stage { return process.env.STAGE as Stage || Env.fail('STAGE'); }

  public static get SLACK_TOKENS(): string[] { return JSON.parse(process.env.SLACK_TOKENS || '[]') as string[]; }

  public static get YOLP_APP_ID(): string { return process.env.YOLP_APP_ID || Env.fail('YOLP_APP_ID'); }


  private static fail(envVarName: string): never {
    console.error(`Environment variable "${envVarName}" is not set`);
    throw new Error(`Environment variable "${envVarName}" is not set`);
  }
}

export type Stage = 'dev' | 'qas' | 'prd';

const appid = Env.YOLP_APP_ID;  // 'cuz to use property shorthand in object literal
