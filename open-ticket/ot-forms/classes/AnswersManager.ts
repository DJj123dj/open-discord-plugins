import { api, openticket } from "#opendiscord";
import * as discord from "discord.js";
import { OTForms_Question } from "../types/configDefaults";

const MAX_EMBED_SIZE = 6000;
const MAX_EMBED_FIELDS = 25;

/**## OTForms_AnswersManager `class`
 * This is an OT Forms plugin answers message manager.
 * 
 * It is responsible for rendering the entire answers message.
 */
export class OTForms_AnswersManager {
    private static _instances: Map<string, OTForms_AnswersManager> = new Map();
    private formId: string;
    private sessionId: string;
    private _message: discord.Message<boolean> | null;
    private pages: api.ODEmbedBuildResult[];
    private source: "button" | "other";
    private _type: "initial" | "partial" | "completed";
    private _user: discord.User;
    private _formColor: discord.ColorResolvable;
    private _answers: { question: OTForms_Question, answer: string | null }[];
    private _currentPage: number = 1;
    private timestamp: number = Date.now();

    constructor(formId: string, sessionId: string, source: "button" | "other", type: "initial" | "partial" | "completed", user: discord.User, formColor: discord.ColorResolvable, answers: { question: OTForms_Question, answer: string | null }[]) {
        this.formId = formId;
        this.sessionId = sessionId;
        this._message = null;
        this.pages = [];
        this.source = source;
        this._type = type;
        this._user = user;
        this._formColor = formColor;
        this._answers = answers;
    }

    get message(): discord.Message<boolean> | null {
        return this._message;
    }

    get user(): discord.User {
        return this._user;
    }
    
    get formColor(): discord.ColorResolvable {
        return this._formColor;
    }

    set type(type: "initial" | "partial" | "completed") {
        this._type = type;
    }

    set answers(answers: { question: OTForms_Question, answer: string | null }[]) {
        this._answers = answers;
    }

    /* getInstance
     * Returns the instance of the answers message manager.
     */
    static getInstance(messageId: string): OTForms_AnswersManager | undefined {
        return OTForms_AnswersManager._instances.get(messageId);
    }

    /* removeInstance
     * Removes the instance of the answers message manager.
     */
    static removeInstance(messageId: string): void {
        OTForms_AnswersManager._instances.delete(messageId);
    }

    /* render
     * Renders the answers message.
     */
    async render(): Promise<void> {
        this.pages = await this.splitAnswersIntoEmbeds(this.source, this._type, this._user, this._formColor, this._answers);
    }

    /* send
     * Sends the answers message.
     */
    async sendMessage(channel: discord.GuildTextBasedChannel, pageNumber: number = this._currentPage): Promise<void> {
        if(this.pages.length === 0) return;
        this._currentPage = pageNumber;
        this._message = await channel.send((await openticket.builders.messages.getSafe("ot-forms:answers-message").build(this.source, { formId: this.formId, sessionId: this.sessionId, type: this._type, currentPageNumber: pageNumber, totalPages: this.pages.length, currentPage: this.pages[pageNumber - 1] })).message);
        const message = this._message;
        if(!message) return;
        OTForms_AnswersManager._instances.set(message.id, this);
        await this.save();
    }

    /* setPage
     * Sets the page of the answers message.
     */
    async editMessage(pageNumber: number = this._currentPage): Promise<void> {
        if(!this._message) return;
        this._currentPage = pageNumber;
        await this._message.edit((await openticket.builders.messages.getSafe("ot-forms:answers-message").build(this.source, { formId: this.formId, sessionId: this.sessionId, type: this._type, currentPageNumber: pageNumber, totalPages: this.pages.length, currentPage: this.pages[pageNumber - 1] })).message);
        await this.save();
    }

    /* getEmbedSize
     * Returns the size of an embed in characters.
     */
    private getEmbedSize = (embed: discord.EmbedBuilder | null): number => {
        return JSON.stringify(embed).length;
    };

    /* splitAnswersIntoEmbeds
     * Splits the answers into multiple embeds if the total size exceeds the Discord limit.
     */
    private async splitAnswersIntoEmbeds(source: "button" | "other", type: "initial" | "partial" | "completed", user: discord.User, formColor: discord.ColorResolvable, answers: { question: OTForms_Question, answer: string | null }[]): Promise<api.ODEmbedBuildResult[]> {
        let embeds: api.ODEmbedBuildResult[] = [];
        let currentEmbedStructure: api.ODEmbedBuildResult;
        let currentEmbed: discord.EmbedBuilder | null;

        let fields: api.ODEmbedData["fields"] = [];

        for (const answer of answers) {
            // Limit the question to 256 characters on the embed field title
            const fieldName = answer.question.question.length > 256 ? answer.question.question.slice(0, 252) + "..." : answer.question.question;
            // Answer are already limited to 1017 characters so are considered safe to use
            const fieldValue = answer.answer || "Unanswered question.";
            fields.push({ name: fieldName, value: `\`\`\`${fieldValue}\`\`\``, inline: false });

            // Creates a new embed with the new field
            currentEmbedStructure = await openticket.builders.embeds.getSafe("ot-forms:answers-embed").build(source, { type, user, formColor, fields, timestamp: this.timestamp });
            currentEmbed = currentEmbedStructure.embed;
            if(!currentEmbed) return embeds;
            // Checks the size of the new embed
            const newEmbedSize = this.getEmbedSize(currentEmbed);
            const embedFields = currentEmbed.data.fields;
            if(!embedFields) return embeds;
    
            // If the total size exceeds the 6000 characters limit or the fields are more than 25, creates a new embed
            if (newEmbedSize > MAX_EMBED_SIZE || embedFields.length >= MAX_EMBED_FIELDS) {
                fields.pop();
                currentEmbedStructure = await openticket.builders.embeds.getSafe("ot-forms:answers-embed").build(source, { type, user, formColor, fields, timestamp: this.timestamp });
                embeds.push(currentEmbedStructure);
                fields = [{ name: fieldName, value: `\`\`\`${fieldValue}\`\`\`` }];
            }
        };
  
        // Adds the last embed
        if (fields.length > 0) {
            currentEmbedStructure = await openticket.builders.embeds.getSafe("ot-forms:answers-embed").build(source, { type, user, formColor, fields, timestamp: this.timestamp });
            embeds.push(currentEmbedStructure);
        }
    
        return embeds;
    };

    /* save
     * Saves the answers message to the database so the AnswersManager could be restored if bot restarts.
     */
    private async save(): Promise<void> {
        // Save the answers message to the database
        const data: {
            formId: string,
            sessionId: string,
            messageId: string | null,
            source: "button" | "other",
            type: "initial" | "partial" | "completed",
            userId: string,
            formColor: discord.ColorResolvable,
            answers: { question: OTForms_Question, answer: string | null }[],
            currentPage: number,
            timestamp: number
        } = {
            formId: this.formId,
            sessionId: this.sessionId,
            messageId: this._message ? this._message.id : null,
            source: this.source,
            type: this._type,
            userId: this._user.id,
            formColor: this._formColor,
            answers: this._answers,
            currentPage: this._currentPage,
            timestamp: this.timestamp
        };

        const channelId = this._message ? this._message.channel.id : null;
        const messageId = this._message ? this._message.id : null;

        openticket.databases.get("openticket:global").set("ot-forms:answers-manager", `${channelId}_${messageId}`, data);
    }

    /* restore
     * Restores the answers message from the database.
     */
    static async restore(): Promise<void> {
        const globalDatabase = openticket.databases.get("openticket:global")
        const answersManagerCategory = await globalDatabase.getCategory("ot-forms:answers-manager") ?? [];

        for (const answersManagerData of answersManagerCategory) {
            const data: {
                formId: string,
                sessionId: string,
                messageId: string | null,
                source: "button" | "other",
                type: "initial" | "partial" | "completed",
                userId: string,
                formColor: discord.ColorResolvable,
                answers: { question: OTForms_Question, answer: string | null }[],
                currentPage: number,
                timestamp: number
            } = answersManagerData.value;

            const formId = data.formId;
            const sessionId = data.sessionId;
            const messageId = data.messageId;
            const source = data.source;
            const type = data.type;
            const userId = data.userId;
            const formColor = data.formColor;
            const answers = data.answers;
            const currentPage = data.currentPage;

            const user = await openticket.client.client.users.fetch(userId);

            const channelId = answersManagerData.key.split("_")[0];
            let channel: discord.Channel | null;
            try {
                channel = await openticket.client.client.channels.fetch(channelId);
            } catch (error) {
                openticket.log("Channel not found for restoring answers manager. Form answers will not be restored.", "plugin", [
                    {key:"channel", value:channelId}
                ]);
                globalDatabase.delete("ot-forms:answers-manager", `${channelId}_${messageId}`);
                return;
            }
            if(!channel || !channel.isTextBased()) {
                openticket.log("Channel not found for restoring answers manager. Form answers will not be restored.", "plugin", [
                    {key:"channel", value:channelId}
                ]);
                return;
            }
            
            if(!messageId) {
                openticket.log("Message ID not found for restoring answers manager. Form answers will not be restored.", "plugin");
                return;
            }
            let message: discord.Message | null;
            try {
                message = await channel.messages.fetch(messageId);
            } catch (error) {
                openticket.log("Message not found for restoring answers manager. Form answers will not be restored.", "plugin", [
                    {key:"message", value:messageId}
                ]);
                globalDatabase.delete("ot-forms:answers-manager", `${channelId}_${messageId}`);
                return;
            }

            if (!message) {
                openticket.log("Message not found for restoring answers manager. Form answers will not be restored.", "plugin", [
                    {key:"message", value:messageId}
                ]);
                return;
            }

            const answersManager = new OTForms_AnswersManager(formId, sessionId, source, type, user, formColor, answers);
            answersManager._currentPage = currentPage;
            answersManager.timestamp = data.timestamp;
            answersManager._message = message;
            await answersManager.render();
            OTForms_AnswersManager._instances.set(message.id, answersManager);
        }
    }
}