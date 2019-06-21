import 'reflect-metadata';  // tslint:disable-line:no-import-side-effect ordered-imports - 'cuz to use ES7 Reflect API with tsyringe

// tslint:disable-next-line: ordered-imports - 'cus to place side effect imports at the beginning of the line
import { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { container } from 'tsyringe';
import { Env } from '~/config';
import { Attachment, SlackApi, SlashCommand } from '~/external-api/slack';

const apis = {
  slack: container.resolve(SlackApi)
};


/**
 * Slack weather command's AWS Lambda function handler.
 *
 * @param event – API Gateway "event".
 * @see http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
 * @see https://api.slack.com/slash-commands
 */
export const handler: Handler<APIGatewayProxyEvent, void> = async (event: APIGatewayProxyEvent): Promise<void> => {
  console.debug('Starting Lambda handler: event=%s', JSON.stringify(event));

  // tslint:disable-next-line: no-any - 'cus to parse non-JSON, JavaScript object literal like strings by Slack
  const command = event.body as any as SlashCommand;
  if (Env.SLACK_TOKENS.length !== 0 && !Env.SLACK_TOKENS.includes(command.token)) {
    return console.error('Forbidden: team=%s, command=%s', command.team_domain, JSON.stringify(command, undefined, 2));
  }

  try {
    await apis.slack.response(command, { text: command.text });
  } catch (err) { await handleError(err as object, command); }
};


const handleError = async (err: object, command: SlashCommand): Promise<void> => {
  console.error(err);
  const attachments: Attachment[] = [];
  if (err instanceof Error && Env.STAGE === 'dev') {
    attachments.push({ text: err.stack });
  }
  await apis.slack.response(command, { text: 'エラーが発生しました。', attachments });
};
