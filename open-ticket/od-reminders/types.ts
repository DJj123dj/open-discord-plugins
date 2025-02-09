import { opendiscord, api, utilities } from "#opendiscord"
import { ODReminder, ODReminderManager, ODReminderData, ODReminderJson } from "./reminder"

declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "od-reminders":api.ODPlugin
    }
    export interface ODMessageManagerIds_Default {
        "od-reminders:reminder-message":{source:"other",params:{reminder:ODReminder},workers:"od-reminders:reminder-message"},
        "od-reminders:list-message":{source:"slash"|"other",params:{reminders:ODReminder[]},workers:"od-reminders:list-message"},
        "od-reminders:success-message":{source:"slash"|"other",params:{ scope: "created"|"paused"|"resumed"|"deleted"|"listed" },workers:"od-reminders:success-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "od-reminders:reminder-embed":{source:"other",params:{reminder:ODReminder},workers:"od-reminders:reminder-embed"},
        "od-reminders:list-embed":{source:"slash"|"other",params:{reminders:ODReminder[]},workers:"od-reminders:list-embed"},
    }
    export interface ODSlashCommandManagerIds_Default {
        "od-reminders:create":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "od-reminders:create":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "od-reminders:create":{source:"slash"|"text",params:{},workers:"od-reminders:create"|"ot-reminders:logs"},
    }
    export interface ODPluginClassManagerIds_Default {
        "od-reminders:manager":ODReminderManager
        "od-reminders:reminder":ODReminder
        "od-reminders:reminder-data":ODReminderData<ODReminderJson>
    }
    export interface ODFormattedJsonDatabaseIds_DefaultGlobal {
        "od-reminders:reminder":ODReminderJson
    }
}