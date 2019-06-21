import { injectable } from 'tsyringe';
import { AxiosHttpClient } from '~/external-api/axios';


/**
 * Slack APIs.
 * @see https://api.slack.com/
 */
@injectable()
export class SlackApi {

  public constructor(private readonly client: AxiosHttpClient) {}


  /**
   * Response to the Slash command.
   * @param command Slash command.
   * @param message Slash command execution result message.
   */
  public async response(command: SlashCommand, message: Message): Promise<void> {
    await this.client.post(command.response_url, message);
  }
}


// tslint:disable: completed-docs - 'cuz model definition of external API, for details refer to the official document
/**
 * Receiving model of Slash command.
 * @see https://api.slack.com/slash-commands#app_command_handling
 */
export interface SlashCommand {
  token: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id?: string;
  user_id: string;
  user_name: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  enterprise_id?: string;
  enterprise_name?: string;
}

/**
 * Slash command execution result message.
 * @see https://api.slack.com/slash-commands#responding_immediate_response
 */
export interface Message {
  text: string;
  attachments?: Attachment[];
  response_type?: 'in_channel' | 'ephemeral';
}

/**
 * Attaching content and links to messages.
 * @see https://api.slack.com/docs/message-attachments
 */
export interface Attachment {
  fallback?: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: [
    {
      title: string;
      value: string;
      short: boolean;
    }
  ];
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}
