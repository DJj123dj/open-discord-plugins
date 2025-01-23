import { api, openticket, utilities } from "../../src/index";

import { OTCommandTranslateConfig_Default } from "./configDefaults";
import { commandTranslateConfigStructure } from "./checkerStructures";

if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")
if (!utilities.isBeta) throw new api.ODPluginError("This plugin is made for the beta version of Open Ticket!")


//DECLARATION
declare module "../../src/core/api/api.js" {
    export interface ODConfigManagerIds_Default {
        "ot-translate-cmds:config": OTCommandTranslateConfig_Default;
    }
    export interface ODHelpMenuManagerIds_Default {
        "dashboard-plugin": api.ODHelpMenuCategory;
    }
    export interface ODCheckerManagerIds_Default {
        "ot-translate-cmds:config":api.ODChecker;
    }
}

openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTCommandTranslateConfig_Default("ot-translate-cmds:config","config.json","./plugins/ot-translate-cmds/"));
})


// REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-translate-cmds:config")
    checkers.add(new api.ODChecker("ot-translate-cmds:config",checkers.storage,0,config,commandTranslateConfigStructure))
})


openticket.events.get("afterSlashCommandsLoaded").listen(async (slash, client) => {
    const commandData = openticket.configs.get("ot-translate-cmds:config").data;

    for (const commandCfg of commandData) {
        const cmd = openticket.client.slashCommands.get(`openticket:${commandCfg.name}`);
        if (!cmd) continue;

        // COMMAND TRANSLATION
        cmd.builder.nameLocalizations = commandCfg.nameTranslations || {};
        cmd.builder.descriptionLocalizations = commandCfg.descriptionTranslations || {};

        if (commandCfg.options) {
            for (const optionCfg of commandCfg.options) {
                const option = cmd.builder.options?.find(o => o.name === optionCfg.name);
                if (!option) continue;

                // OPTION/SUBCOMMAND TRANSLATION
                option.nameLocalizations = optionCfg.nameTranslations || {};
                option.descriptionLocalizations = optionCfg.descriptionTranslations || {};

                // CHOICE TRANSLATION
                if(optionCfg.choices && "choices" in option) {
                    for (const choiceCfg of optionCfg.choices) {
                        const choice = option.choices?.find(c => c.name === choiceCfg.name);
                        if (!choice) continue;

                        choice.nameLocalizations = choiceCfg.nameTranslations || {};
                    }
                }

                if (optionCfg.type === "subcommand" && optionCfg.options && "options" in option) {
                    for (const subOptCfg of optionCfg.options) {
                        const subOption = option.options?.find(o => o.name === subOptCfg.name);
                        if (!subOption) continue;

                        // SUBCOMMAND OPTION TRANSLATION
                        subOption.nameLocalizations = subOptCfg.nameTranslations || {};
                        subOption.descriptionLocalizations = subOptCfg.descriptionTranslations || {};

                        // CHOICE TRANSLATION
                        if(subOptCfg.choices && "choices" in subOption) {
                            for (const choiceCfg of subOptCfg.choices) {
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
});