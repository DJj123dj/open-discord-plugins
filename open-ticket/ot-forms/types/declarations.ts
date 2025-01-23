import { api } from "#opendiscord";
import discord from "discord.js";
import { ODJsonConfig_DefaultForms, OTForms_Question, OTForms_ButtonQuestion, OTForms_DropdownQuestion, OTForms_ModalQuestion, OTForms_DropdownOption, OTForms_ButtonOption } from "./configDefaults";

declare module "#opendiscord-types" {
    export interface ODConfigManagerIds_Default {
        "ot-forms:config":ODJsonConfig_DefaultForms
    }
    export interface ODCheckerManagerIds_Default {
        "ot-forms:config":api.ODChecker
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-forms:form":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-forms:form":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-forms:form":{source:"slash"|"text",params:{},workers:"ot-forms:form"|"ot-forms:logs"},
    }
    export interface ODMessageManagerIds_Default {
        "ot-forms:start-form-message": { source: "ticket" | "slash"; params: { formId: string, formName: string, formDescription: string, formColor: discord.ColorResolvable, acceptAnswers: boolean }; workers: "ot-forms:start-form-message" };
        "ot-forms:continue-message": { source: "button"; params: { formId: string, sessionId: string, currentSection:number, totalSections:number, formColor: discord.ColorResolvable }; workers: "ot-forms:continue-message" };
        "ot-forms:question-message": { source: "other"; params: { formId: string, sessionId: string, question: OTForms_ButtonQuestion|OTForms_DropdownQuestion, currentSection:number, totalSections:number, formColor: discord.ColorResolvable }; workers: "ot-forms:question-message" };
        "ot-forms:answers-message": { source: "button" | "other"; params: { formId: string, sessionId: string, type: "initial" | "partial" | "completed", currentPageNumber: number, totalPages: number, currentPage: api.ODEmbedBuildResult }; workers: "ot-forms:answers-message" };
        "ot-forms:success-message": { source: "slash" | "other"; params: {}; workers: "ot-forms:success-message" };
    }
    export interface ODEmbedManagerIds_Default {
        "ot-forms:start-form-embed": { source: "ticket" | "slash"; params: { formName: string, formDescription: string, formColor: discord.ColorResolvable }; workers: "ot-forms:start-form-embed" };
        "ot-forms:continue-embed": { source: "button"; params: { currentSection:number, totalSections:number, formColor: discord.ColorResolvable }; workers: "ot-forms:continue-embed" };
        "ot-forms:question-embed": { source: "other"; params: { question: OTForms_ButtonQuestion|OTForms_DropdownQuestion, currentSection:number, totalSections:number, formColor: discord.ColorResolvable }; workers: "ot-forms:question-embed" };
        "ot-forms:answers-embed": { source: "button" | "other"; params: { type: "initial" | "partial" | "completed", user: discord.User, formColor: discord.ColorResolvable, fields: api.ODEmbedData["fields"], timestamp: Date }; workers: "ot-forms:answers-embed" };
    }
    export interface ODButtonManagerIds_Default {
        "ot-forms:start-form-button": { source: "ticket" | "slash"; params: { formId: string, enabled: boolean }; workers: "ot-forms:start-form-button" };
        "ot-forms:continue-button": { source: "button"; params: { formId: string, sessionId: string }; workers: "ot-forms:continue-button" };
        "ot-forms:question-button": { source: "other"; params: { formId: string, sessionId: string, option: OTForms_ButtonOption }; workers: "ot-forms:question-button" };
        "ot-forms:delete-answers-button": { source: "button" | "other"; params: { formId: string, sessionId: string }; workers: "ot-forms:delete-answers-button" };
        "ot-forms:next-page-button": { source: "button" | "other"; params: { currentPageNumber: number }; workers: "ot-forms:next-page-button" };
        "ot-forms:previous-page-button": { source: "button" | "other"; params: { currentPageNumber: number }; workers: "ot-forms:previous-page-button" };
        "ot-forms:page-number-button": { source: "button" | "other"; params: { currentPageNumber: number, totalPages: number }; workers: "ot-forms:page-number-button" };
    }
    export interface ODButtonResponderManagerIds_Default {
        "ot-forms:start-form-button":{source:"button",params:{},workers:"ot-forms:start-form-button"},
        "ot-forms:continue-button":{source:"button",params:{},workers:"ot-forms:continue-button"},
        "ot-forms:question-button":{source:"button",params:{},workers:"ot-forms:question-button"},
        "ot-forms:delete-answers-button":{source:"button",params:{},workers:"ot-forms:delete-answers-button"},
        "ot-forms:next-page-button":{source:"button",params:{},workers:"ot-forms:next-page-button"},
        "ot-forms:previous-page-button":{source:"button",params:{},workers:"ot-forms:previous-page-button"},
        "ot-forms:page-number-button":{source:"button",params:{},workers:"ot-forms:page-number-button"},
    }
    export interface ODModalManagerIds_Default {
        "ot-forms:questions-modal":{source:"button"|"panel-button"|"panel-dropdown"|"slash"|"ticket"|"other";params:{ formId: string, sessionId: string, formName:string, questions:OTForms_ModalQuestion[], currentSection:number, totalSections:number };workers:"ot-forms:questions-modal"},
    }   
    export interface ODModalResponderManagerIds_Default {
        "ot-forms:questions-modal":{source:"modal";params:{};workers:"ot-forms:questions-modal"},
    }
    export interface ODDropdownManagerIds_Default {
        "ot-forms:question-dropdown": { source: "other"; params: { formId: string, sessionId: string, options: OTForms_DropdownOption[], minValues: number, maxValues: number, placeholder: string }; workers: "ot-forms:question-dropdown" };
    }
    export interface ODDropdownResponderManagerIds_Default {
        "ot-forms:question-dropdown": { source: "dropdown"; params: { }; workers: "ot-forms:question-dropdown" };
    }
    export interface ODFormattedJsonDatabaseIds_DefaultGlobal {
        "ot-forms:answers-manager":{
                    formId: string,
                    sessionId: string,
                    messageId: string | null,
                    source: "button" | "other",
                    type: "initial" | "partial" | "completed",
                    userId: string,
                    formColor: discord.ColorResolvable,
                    answers: { question: OTForms_Question, answer: string | null }[],
                    currentPage: number,
                    timestamp: Date
                },
    }
}