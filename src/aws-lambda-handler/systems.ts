import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { Config } from '~/config';


/**
 * Systems Web API's AWS Lambda function handler.
 *
 * @param event – API Gateway "event".
 * @see http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
 */
export const handler: APIGatewayProxyHandler = (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.debug('Starting Lambda handler: event=%s', JSON.stringify(event));
  return Promise.resolve({
    statusCode: 200,
    body: JSON.stringify({
      name: Config.NAME,
      version: Config.VERSION
    })
  });
};
