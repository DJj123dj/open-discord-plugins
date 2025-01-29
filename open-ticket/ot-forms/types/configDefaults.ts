import { api } from '#opendiscord'
import * as discord from "discord.js"

/* FORM
 * This is the main structure of the form
 */
interface OTForms_Form {
    id: string,
    name: string,
    description: string,
    color: discord.ColorResolvable,
    responsesChannel: string,
    OTTicketAutoSend: string[],
    questions: OTForms_Question[]
}

/* QUESTION
 * This is the main structure of a question
 */
export interface OTForms_Question {
    number: number,
    question: string,
    type: "short" | "long" | "dropdown" | "button",
}

/* DROPDOWN QUESTION
 * This is the structure of a question TYPE DROPDOWN
 */
export interface OTForms_DropdownQuestion extends OTForms_Question {
    type: "dropdown",
    placeholder: string,
    minAnswerOptions: number,
    maxAnswerOptions: number,
    options: OTForms_DropdownOption[]
}

/* BUTTON QUESTION
 * This is the structure of a question TYPE BUTTON
 */
export interface OTForms_ButtonQuestion extends OTForms_Question {
    type: "button",
    options: OTForms_ButtonOption[]
}

/* MODAL QUESTION
 * This is the structure of a question TYPE MODAL
 */
export interface OTForms_ModalQuestion extends OTForms_Question {
    type: "short" | "long",
    placeholder: string,
    optional: boolean,
}

/* OPTION
 * This is the structure of an answer option for a question
 */
export interface OTForms_Option {
    option: string,
    emoji: string
}

/* BUTTON OPTION
 * This is the structure of an answer option for a question TYPE BUTTON
 */
export interface OTForms_ButtonOption extends OTForms_Option {
    color: api.ODValidButtonColor
}

/* DROPDOWN OPTION
 * This is the structure of an answer option for a question TYPE DROPDOWN
 */
export interface OTForms_DropdownOption extends OTForms_Option {
    description: string
}

/* DEFAULT FORMS CONFIG
 * This is the default structure of the forms config
 */
export class ODJsonConfig_DefaultForms extends api.ODJsonConfig {
    declare data: OTForms_Form[]
}