import {api, openticket, utilities} from "#opendiscord"
import * as discord from "discord.js"

/** ## OTForms_Form `interface`
 * This is the main structure of the form
 */
export interface OTForms_Form {
    id: string,
    name: string,
    description: string,
    color: discord.ColorResolvable,

    responseChannel: string,
    autoSendOptionIds: string[],

    questions: OTForms_Question[]
}

/** ## OTForms_Question `interface`
 * This is the main structure of a question
 */
export interface OTForms_Question {
    position: number,
    question: string,
    type: "short" | "paragraph" | "dropdown" | "button",
}

/** ## OTForms_DropdownQuestion `interface`
 * This is the structure of a question TYPE DROPDOWN
 */
export interface OTForms_DropdownQuestion extends OTForms_Question {
    type: "dropdown",
    placeholder: string,
    minAnswerChoices: number,
    maxAnswerChoices: number,
    choices: OTForms_DropdownChoice[]
}

/** ## OTForms_ButtonQuestion `interface`
 * This is the structure of a question TYPE BUTTON
 */
export interface OTForms_ButtonQuestion extends OTForms_Question {
    type: "button",
    choices: OTForms_ButtonChoice[]
}

/** ## OTForms_ModalQuestion `interface`
 * This is the structure of a question TYPE MODAL
 */
export interface OTForms_ModalQuestion extends OTForms_Question {
    type: "short" | "paragraph",
    placeholder: string,
    optional: boolean,
}

/** ## OTForms_Choice `interface`
 * This is the structure of an answer choice for a question
 */
export interface OTForms_Choice {
    name: string,
    emoji: string
}

/** ## OTForms_ButtonChoice `interface`
 * This is the structure of an answer choice for a question TYPE BUTTON
 */
export interface OTForms_ButtonChoice extends OTForms_Choice {
    color: api.ODValidButtonColor
}

/** ## OTForms_DropdownChoice `interface`
 * This is the structure of an answer choice for a question TYPE DROPDOWN
 */
export interface OTForms_DropdownChoice extends OTForms_Choice {
    description: string
}

/** ## ODJsonConfig_DefaultForms `class`
 * This is the default structure of the forms config
 */
export class ODJsonConfig_DefaultForms extends api.ODJsonConfig {
    declare data: OTForms_Form[]
}