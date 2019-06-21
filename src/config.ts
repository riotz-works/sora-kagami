// tslint:disable: completed-docs - 'cuz configuration variables
import { name, version } from '~/../package.json';


/**
 * Application config definition.
 */
export class Config {

  public static readonly NAME = name;
  public static readonly VERSION = version;
}


/**
 * Environment variable definition.
 */
export class Env {

  public static get STAGE(): Stage { return process.env.STAGE as Stage || Env.fail('STAGE'); }


  private static fail(envVarName: string): never {
    console.error(`Environment variable "${envVarName}" is not set`);
    throw new Error(`Environment variable "${envVarName}" is not set`);
  }
}

export type Stage = 'dev' | 'qas' | 'prd';
