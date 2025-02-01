import { api, opendiscord } from "#opendiscord"
import * as discord from "discord.js"
import { OTForms_Question, OTForms_ButtonQuestion, OTForms_DropdownQuestion, OTForms_ModalQuestion } from "../types/configDefaults"
import { OTForms_Form } from "./Form"
import { OTForms_AnswersManager } from "./AnswersManager"

/* FORM SESSION CLASS
 * This is the main clas of a form session (every user answering a form is a OTForms_FormSession).
 * A single user can have multiple OTForms_FormSession instances.
 * Sends form questions and manage answers.
 */
export class OTForms_FormSession {
    private id: string;
    user: discord.User;
    private form: OTForms_Form;
    private currentSection: number = 1;
    private currentQuestionNumber: number = 0;
    private answers: { question: OTForms_Question, answer: string | null }[] = [];
    private instance: api.ODButtonResponderInstance | api.ODDropdownResponderInstance | api.ODModalResponderInstance | undefined;
    private answersManager: OTForms_AnswersManager | undefined;
    private sessionMessage: api.ODMessageBuildSentResult<boolean> | null = null;

    constructor(id: string, user: discord.User, form: OTForms_Form) {
        this.id = id;
        this.user = user;
        this.form = form;
    }

    /* START FORM SESSION
     * Starts the form session. Sends the first question to the user.
     */
    public async start(): Promise<void> {
        await this.sendNextQuestion();
    }

    /* CONTINUE FORM SESSION
     * Moves to the next step on the form session. It sends the next question, the continue message or finalize the session.
     */
    public async continue(mode:"question" | "continue"): Promise<void> {
        if(this.currentQuestionNumber >= this.form.questions.length) {
            this.currentSection++;
            await this.finalize();
            return;
        } else if(mode === "question") {
            await this.sendNextQuestion();
            return;
        } else if(mode === "continue") {
            this.currentSection++;
            await this.sendContinueMessage();
            return;
        } else {
            this.currentSection++;
            await this.finalize();
            return;
        }
    }

    /* HANDLE RESPONSE
     * Handles the response of a type button or dropdown question. 
     * Stores the answer and sends the next question.
     */
    private handleResponse(answers: { question: OTForms_Question; answer: string | null; }[]): void {
        this.currentQuestionNumber++;
        this.answers = this.answers.concat(answers);
        this.updateAnswersMessage();
        this.continue("continue");
    }

    /* HANDLE BUTTON RESPONSE
     * Handles the response of a button question.
     */
    public async handleButtonResponse(response: string): Promise<void> {
        const question = this.form.questions[this.currentQuestionNumber];
        const answers = [{ question, answer: response }];
        this.handleResponse(answers);
    }

    /* HANDLE DROPDOWN RESPONSE
     * Handles the response of a dropdown question.
     */
    public async handleDropdownResponse(response: api.ODDropdownResponderInstanceValues): Promise<void> {
        const question = this.form.questions[this.currentQuestionNumber];
        const answer = response.getStringValues().join(", ");
        const answers = [{ question, answer }];
        this.handleResponse(answers);
    }

    /* HANDLE MODAL RESPONSE
     * Handles the response of a modal question.
     */
    public async handleModalResponse(response: api.ODModalResponderInstanceValues, answeredQuestions: { number: number; required: boolean; }[]): Promise<void> {
        const answers = answeredQuestions.map(q => ({
            question: this.form.questions[q.number-1],
            answer: q.required 
                    ? response.getTextField(q.number.toString(), true)
                    : response.getTextField(q.number.toString(), false)
        }))
        this.currentQuestionNumber = this.currentQuestionNumber + answers.length - 1;
        this.handleResponse(answers);
    }

    /* SET INSTANCE
     * Sets the instance of the current interaction for the form session.
     */
    public async setInstance(instance: api.ODButtonResponderInstance | api.ODDropdownResponderInstance | api.ODModalResponderInstance, onlyIfNotSessionMessage: boolean = false) {
        if(!onlyIfNotSessionMessage) this.instance = instance;
        else if(!this.sessionMessage) {
            this.instance = instance
        } else {
            await instance.defer("update", true);
        }
    }

    /* SEND NEXT QUESTION
     * Sends the next question to the user.
     */
    private async sendNextQuestion(): Promise<void> {
        const question = this.form.questions[this.currentQuestionNumber];
        switch (question.type) {
            case 'short':
            case 'paragraph':
                await this.sendModalQuestions();
                break;
            case 'dropdown':
                await this.sendDropdownQuestion(question as OTForms_DropdownQuestion);
                break;
            case 'button':
                await this.sendButtonQuestion(question as OTForms_ButtonQuestion);
                break;
            default:
                console.error('Unknown question type: ', question.type);
        }
    }

    /* MODAL QUESTIONS
     * Sends a modal with maximum 5 question to the user. Questions are added to the modal only if they are consecutive.
     */
    private async sendModalQuestions(): Promise<void> {
        const modalQuestions: OTForms_ModalQuestion[] = [];
        let count = 0;

        if(!this.instance || this.instance.didReply) {
            opendiscord.log("Error: Modal questions have not been sent. Instance not found or already replied.", "plugin");
            return;
        }

        if(!(this.instance instanceof api.ODButtonResponderInstance)) {
            opendiscord.log("Error: Modal questions have not been sent. Current instance is not valid for modals.", "plugin");
            return;
        }
        
        // Max 5 questions per modal
        while (count < 5 && this.currentQuestionNumber + 1 <= this.form.questions.length) {
            const question = this.form.questions[this.currentQuestionNumber + count];
            if (!question || (question.type !== "short" && question.type !== "paragraph")) break;
            modalQuestions.push(question as OTForms_ModalQuestion);
            count++;
        }

        // Show modal
        await this.instance.modal(
            await opendiscord.builders.modals.getSafe("ot-ticket-forms:questions-modal").build("other", {
                formId: this.form.id,
                sessionId: this.id,
                formName: this.form.name,
                questions: modalQuestions,
                currentSection: this.currentSection,
                totalSections: this.form.totalSections
            })
        );
    }

    /* DROPDOWN QUESTION
     * Sends a dropdown question to the user.
     */
    private async sendDropdownQuestion(question: OTForms_DropdownQuestion): Promise<void> {
        if(!this.instance) {
            opendiscord.log("Error: Dropdown question has not been sent. Interaction not found.", "plugin");
            return;
        }

        const message = await opendiscord.builders.messages.getSafe("ot-ticket-forms:question-message").build("other", {
            formId: this.form.id,
            sessionId: this.id,
            question: question,
            currentSection: this.currentSection,
            totalSections: this.form.totalSections,
            formColor: this.form.color
        });

        if(!this.sessionMessage) {
            // Send dropdown question message
            if(this.instance.didReply) {
                opendiscord.log("Error: Dropdown question has not been sent. Interaction already replied.", "plugin");
                return;
            }
            this.sessionMessage = await this.instance.reply(message);
        } else {
            // Update to dropdown question message
            this.instance.update(message);
        }
    }

    /* BUTTON QUESTION
     * Sends a button question to de user.
     */
    private async sendButtonQuestion(question: OTForms_ButtonQuestion): Promise<void> {
        if(!this.instance) {
            opendiscord.log("Error: Button question has not been sent. Interaction not found.", "plugin");
            return;
        }

        const message = await opendiscord.builders.messages.getSafe("ot-ticket-forms:question-message").build("other", {
            formId: this.form.id,
            sessionId: this.id,
            question: question,
            currentSection: this.currentSection,
            totalSections: this.form.totalSections,
            formColor: this.form.color
        });

        if(!this.sessionMessage) {
            // Send button question message
            if(this.instance.didReply) {
                opendiscord.log("Error: Button question has not been sent. Interaction already replied.", "plugin");
                return;
            }
            this.sessionMessage = await this.instance.reply(message);
        } else {
            // Update to button question message
            this.instance.update(message);
        }
    }

    /* CONTINUE MESSAGE
     * Sends a continue message to the user. The message between sections.
     */
    private async sendContinueMessage(): Promise<void> {
        if(!this.instance) {
            opendiscord.log("Error: The continue message has not been sent. Interaction not found.", "plugin");
            return;
        }

        const message = await opendiscord.builders.messages.getSafe("ot-ticket-forms:continue-message").build("button", {
            formId:this.form.id,
            sessionId: this.id,
            currentSection: this.currentSection,
            totalSections: this.form.totalSections,
            formColor: this.form.color
        });

        if(!this.sessionMessage) {
            // Send continue message
            this.sessionMessage = await this.instance.reply(message);
        } else {
            // Update to continue message
            this.instance.update(message);
        }
    }

    /* UPDATE ANSWERS MESSAGE
     * Updates the answers message with the current answers. It's the message that stores all the answers of the user.
     */
    private async updateAnswersMessage(): Promise<void> {
        if(!this.answersManager) {
            this.answersManager = new OTForms_AnswersManager(this.form.id, this.id, "other", "initial", this.user, this.form.color, this.answers);
            await this.answersManager.render();
            await this.answersManager.sendMessage(this.form.answersChannel);
        } else {
            const type: "initial" | "partial" | "completed" = this.currentQuestionNumber >= this.form.questions.length ? "completed" : "partial";
            this.answersManager.answers = this.answers;
            this.answersManager.type = type;

            await this.answersManager.render();
            await this.answersManager.editMessage();
        }
    }

    /* FINALIZE FORM SESSION
     * Sends the final message to the user.
     */
    private async finalize(): Promise<void> {
        if(this.instance) {
            const message = await opendiscord.builders.messages.getSafe("ot-ticket-forms:continue-message").build("button", {
                formId:this.form.id,
                sessionId: this.id,
                currentSection: this.currentSection,
                totalSections: this.form.totalSections,
                formColor: this.form.color
            });

            if(this.sessionMessage) {
                // Update to continue message
                this.instance.update(message);
            } else {
                // Send continue message
                this.sessionMessage = await this.instance.reply(message);
            }
        }
        opendiscord.log(`Form answered.`, "plugin", [
            {key:"Form", value:this.form.name},
            {key:"User", value:this.user.tag}
        ])
    }
}