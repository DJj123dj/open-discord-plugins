import { api, openticket, utilities } from "#opendiscord"
import { OTTranslateCmdsConfig } from "./configDefaults"
import { translateCmdsConfigStructure } from "./checkerStructures"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-translate-cmds":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-translate-cmds:translations": OTTranslateCmdsConfig;
    }
    export interface ODCheckerManagerIds_Default {
        "ot-translate-cmds:translations":api.ODChecker;
    }
}

//REGISTER CONFIG
openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTTranslateCmdsConfig("ot-translate-cmds:translations","translations.json","./plugins/ot-translate-cmds/"));
})

//REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-translate-cmds:translations")
    checkers.add(new api.ODChecker("ot-translate-cmds:translations",checkers.storage,0,config,translateCmdsConfigStructure))
})

//APPLY TRANSLATIONS
openticket.events.get("afterSlashCommandsLoaded").listen(async (slash,client) => {
    const cmdTranslations = openticket.configs.get("ot-translate-cmds:translations").data

    for (const cmdTranslation of cmdTranslations) {
        const cmd = openticket.client.slashCommands.get(`openticket:${cmdTranslation.name}`);
        if (!cmd) continue;

        // COMMAND TRANSLATION
        cmd.builder.nameLocalizations = cmdTranslation.nameTranslations || {};
        cmd.builder.descriptionLocalizations = cmdTranslation.descriptionTranslations || {};

        if (cmdTranslation.options) {
            for (const optTranslation of cmdTranslation.options) {
                const option = cmd.builder.options?.find(o => o.name === optTranslation.name);
                if (!option) continue;

                // OPTION/SUBCOMMAND TRANSLATION
                option.nameLocalizations = optTranslation.nameTranslations || {};
                option.descriptionLocalizations = optTranslation.descriptionTranslations || {};

                // CHOICE TRANSLATION
                if(optTranslation.choices && "choices" in option){
                    for (const choiceCfg of optTranslation.choices){
                        const choice = option.choices?.find(c => c.name === choiceCfg.name);
                        if (!choice) continue;

                        choice.nameLocalizations = choiceCfg.nameTranslations || {};
                    }
                }

                if (optTranslation.type === "subcommand" && optTranslation.options && "options" in option) {
                    for (const subOptTranslation of optTranslation.options) {
                        const subOption = option.options?.find(o => o.name === subOptTranslation.name);
                        if (!subOption) continue;

                        // SUBCOMMAND OPTION TRANSLATION
                        subOption.nameLocalizations = subOptTranslation.nameTranslations || {};
                        subOption.descriptionLocalizations = subOptTranslation.descriptionTranslations || {};

                        // CHOICE TRANSLATION
                        if(subOptTranslation.choices && "choices" in subOption) {
                            for (const choiceCfg of subOptTranslation.choices) {
                                const choice = subOption.choices?.find(c => c.name === choiceCfg.name);
                                if (!choice) continue;

                                choice.nameLocalizations = choiceCfg.nameTranslations || {};
                            }
                        }
                    }
                }
            }
        }
    }
})