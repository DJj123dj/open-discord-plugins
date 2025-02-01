import { api, opendiscord, utilities } from "#opendiscord"
import discord from "discord.js"

export interface OTTranslateCmdsConfigChoice {
    name: string,
    nameTranslations: Record<discord.Locale,string>
}

export interface OTTranslateCmdsConfigOption {
    name: string,
    type: string,
    nameTranslations: Record<discord.Locale,string>,
    descriptionTranslations: Record<discord.Locale,string>,
    choices?: OTTranslateCmdsConfigChoice[],
    options?: OTTranslateCmdsConfigOption[]
}

export class OTTranslateCmdsConfig extends api.ODJsonConfig {
    declare data: {
        name: string,
        type: string,
        nameTranslations: Record<discord.Locale,string>,
        descriptionTranslations: Record<discord.Locale,string>,
        options?: OTTranslateCmdsConfigOption[]
    }[]
}