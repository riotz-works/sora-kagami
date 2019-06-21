import { S3 } from 'aws-sdk';
import { injectable } from 'tsyringe';


/**
 * AWS APIs.
 * @see https://aws.amazon.com/sdk-for-node-js/
 */
@injectable()
export class AwsApi {

  public constructor(private readonly s3: S3) {}


  /**
   * Put the object on S3.
   * @param bucket Bucket name.
   * @param key Object key name.
   * @param body Contents of object.
   * @param contentType Content-Type header.
   */
  public async s3PutObject(bucket: string, key: string, body: S3.Body, contentType?: string): Promise<void> {
    await this.s3.upload({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }).promise();
  }
}
