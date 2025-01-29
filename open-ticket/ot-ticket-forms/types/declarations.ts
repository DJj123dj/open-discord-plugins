import { api } from "#opendiscord";
import discord from "discord.js";
import { ODJsonConfig_DefaultForms, OTForms_Question, OTForms_ButtonQuestion, OTForms_DropdownQuestion, OTForms_ModalQuestion, OTForms_DropdownChoice, OTForms_ButtonChoice } from "./configDefaults";

declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-ticket-forms":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-ticket-forms:config":ODJsonConfig_DefaultForms
    }
    export interface ODCheckerManagerIds_Default {
        "ot-ticket-forms:config":api.ODChecker
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-ticket-forms:form":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-ticket-forms:form":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-ticket-forms:form":{source:"slash"|"text",params:{},workers:"ot-ticket-forms:form"|"ot-ticket-forms:logs"},
    }
    export interface ODMessageManagerIds_Default {
        "ot-ticket-forms:start-form-message": { source: "ticket" | "slash"; params: { formId: string, formName: string, formDescription: string, formColor: discord.ColorResolvable, acceptAnswers: boolean }; workers: "ot-ticket-forms:start-form-message" };
        "ot-ticket-forms:continue-message": { source: "button"; params: { formId: string, sessionId: string, currentSection:number, totalSections:number, formColor: discord.ColorResolvable }; workers: "ot-ticket-forms:continue-message" };
        "ot-ticket-forms:question-message": { source: "other"; params: { formId: string, sessionId: string, question: OTForms_ButtonQuestion|OTForms_DropdownQuestion, currentSection:number, totalSections:number, formColor: discord.ColorResolvable }; workers: "ot-ticket-forms:question-message" };
        "ot-ticket-forms:answers-message": { source: "button" | "other"; params: { formId: string, sessionId: string, type: "initial" | "partial" | "completed", currentPageNumber: number, totalPages: number, currentPage: api.ODEmbedBuildResult }; workers: "ot-ticket-forms:answers-message" };
        "ot-ticket-forms:success-message": { source: "slash" | "other"; params: {}; workers: "ot-ticket-forms:success-message" };
    }
    export interface ODEmbedManagerIds_Default {
        "ot-ticket-forms:start-form-embed": { source: "ticket" | "slash"; params: { formName: string, formDescription: string, formColor: discord.ColorResolvable }; workers: "ot-ticket-forms:start-form-embed" };
        "ot-ticket-forms:continue-embed": { source: "button"; params: { currentSection:number, totalSections:number, formColor: discord.ColorResolvable }; workers: "ot-ticket-forms:continue-embed" };
        "ot-ticket-forms:question-embed": { source: "other"; params: { question: OTForms_ButtonQuestion|OTForms_DropdownQuestion, currentSection:number, totalSections:number, formColor: discord.ColorResolvable }; workers: "ot-ticket-forms:question-embed" };
        "ot-ticket-forms:answers-embed": { source: "button" | "other"; params: { type: "initial" | "partial" | "completed", user: discord.User, formColor: discord.ColorResolvable, fields: api.ODEmbedData["fields"], timestamp: Date }; workers: "ot-ticket-forms:answers-embed" };
    }
    export interface ODButtonManagerIds_Default {
        "ot-ticket-forms:start-form-button": { source: "ticket" | "slash"; params: { formId: string, enabled: boolean }; workers: "ot-ticket-forms:start-form-button" };
        "ot-ticket-forms:continue-button": { source: "button"; params: { formId: string, sessionId: string }; workers: "ot-ticket-forms:continue-button" };
        "ot-ticket-forms:question-button": { source: "other"; params: { formId: string, sessionId: string, choice: OTForms_ButtonChoice }; workers: "ot-ticket-forms:question-button" };
        "ot-ticket-forms:delete-answers-button": { source: "button" | "other"; params: { formId: string, sessionId: string }; workers: "ot-ticket-forms:delete-answers-button" };
        "ot-ticket-forms:next-page-button": { source: "button" | "other"; params: { currentPageNumber: number }; workers: "ot-ticket-forms:next-page-button" };
        "ot-ticket-forms:previous-page-button": { source: "button" | "other"; params: { currentPageNumber: number }; workers: "ot-ticket-forms:previous-page-button" };
        "ot-ticket-forms:page-number-button": { source: "button" | "other"; params: { currentPageNumber: number, totalPages: number }; workers: "ot-ticket-forms:page-number-button" };
    }
    export interface ODButtonResponderManagerIds_Default {
        "ot-ticket-forms:start-form-button":{source:"button",params:{},workers:"ot-ticket-forms:start-form-button"},
        "ot-ticket-forms:continue-button":{source:"button",params:{},workers:"ot-ticket-forms:continue-button"},
        "ot-ticket-forms:question-button":{source:"button",params:{},workers:"ot-ticket-forms:question-button"},
        "ot-ticket-forms:delete-answers-button":{source:"button",params:{},workers:"ot-ticket-forms:delete-answers-button"},
        "ot-ticket-forms:next-page-button":{source:"button",params:{},workers:"ot-ticket-forms:next-page-button"},
        "ot-ticket-forms:previous-page-button":{source:"button",params:{},workers:"ot-ticket-forms:previous-page-button"},
        "ot-ticket-forms:page-number-button":{source:"button",params:{},workers:"ot-ticket-forms:page-number-button"},
    }
    export interface ODModalManagerIds_Default {
        "ot-ticket-forms:questions-modal":{source:"button"|"panel-button"|"panel-dropdown"|"slash"|"ticket"|"other";params:{ formId: string, sessionId: string, formName:string, questions:OTForms_ModalQuestion[], currentSection:number, totalSections:number };workers:"ot-ticket-forms:questions-modal"},
    }   
    export interface ODModalResponderManagerIds_Default {
        "ot-ticket-forms:questions-modal":{source:"modal";params:{};workers:"ot-ticket-forms:questions-modal"},
    }
    export interface ODDropdownManagerIds_Default {
        "ot-ticket-forms:question-dropdown": { source: "other"; params: { formId: string, sessionId: string, choices: OTForms_DropdownChoice[], minValues: number, maxValues: number, placeholder: string }; workers: "ot-ticket-forms:question-dropdown" };
    }
    export interface ODDropdownResponderManagerIds_Default {
        "ot-ticket-forms:question-dropdown": { source: "dropdown"; params: { }; workers: "ot-ticket-forms:question-dropdown" };
    }
    export interface ODFormattedJsonDatabaseIds_DefaultGlobal {
        "ot-ticket-forms:answers-manager":{
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
        },
    }
}