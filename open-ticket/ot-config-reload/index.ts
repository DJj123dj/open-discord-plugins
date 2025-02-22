import { api, opendiscord, utilities } from "#opendiscord"
import * as discord from "discord.js";

if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-config-reload":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-config-reload:general": api.ODJsonConfig_DefaultGeneral;
        "ot-config-reload:options": api.ODJsonConfig_DefaultOptions;
        "ot-config-reload:panels": api.ODJsonConfig_DefaultPanels;
        "ot-config-reload:questions": api.ODJsonConfig_DefaultQuestions;
        "ot-config-reload:transcripts": api.ODJsonConfig_DefaultTranscripts;
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-config-reload:reload": api.ODSlashCommand;
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-config-reload:reload": api.ODTextCommand;
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-config-reload:reload": { source: "slash" | "text"; params: {}; workers: "ot-config-reload:reload" };
    }
    export interface ODMessageManagerIds_Default {
        "ot-config-reload:config-reload-result": { source: "slash" | "text" | "other"; params: { checkerResult: api.ODCheckerResult }; workers: "ot-config-reload:config-reload-result" };
    }
    export interface ODEmbedManagerIds_Default {
        "ot-config-reload:config-reload-result": { source: "slash" | "text" | "other"; params: { messages: api.ODCheckerMessage[], nEmbed?: number }; workers: "ot-config-reload:config-reload-result" };
        "ot-config-reload:config-reload-failure": { source: "slash" | "text" | "other"; params: {}; workers: "ot-config-reload:config-reload-failure" };
        "ot-config-reload:config-reload-success": { source: "slash" | "text" | "other"; params: {}; workers: "ot-config-reload:config-reload-success" };
    }
}

const lang = opendiscord.languages;
const acot = discord.ApplicationCommandOptionType;

//CHECK IF USING DEVCONFIG
function getConfigPath(){
    const devconfigFlag = opendiscord.flags.get("opendiscord:dev-config")
    const isDevconfig = devconfigFlag ? devconfigFlag.value : false

    return (isDevconfig) ? "./devconfig/" : "./config/"
}

//REGISTER COMMANDS
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("ot-config-reload:reload", {
        name: "reload",
        description: "Reload Open Ticket config files without restarting the bot.",
        type: discord.ApplicationCommandType.ChatInput,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall],
        options: [
            {
                name: 'config',
                description: 'Select the optional config to reload.',
                type: acot.String,
                required: false,
                choices: [
                    { name: "general", value: "general" },
                    { name: "options", value: "options" },
                    { name: "panels", value: "panels" },
                    { name: "questions", value: "questions" },
                    { name: "transcripts", value: "transcripts" },
                ],
            }
        ]
    }));
});

opendiscord.events.get("onTextCommandLoad").listen((text) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general");
    text.add(
        new api.ODTextCommand("ot-config-reload:reload", {
            name: "reload",
            prefix: generalConfig.data.prefix,
            dmPermission: false,
            guildPermission: true,
            allowBots: false,
            options: [
                {
                    name: "config",
                    type: "string",
                    required: false,
                    allowSpaces: false,
                    choices: [
                        "general",
                        "options",
                        "panels",
                        "questions",
                        "transcripts",
                    ]
                }
            ]
        })
    );
});

//MESSAGE BUILDER
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-config-reload:config-reload-result"));
    messages.get("ot-config-reload:config-reload-result").workers.add(
        new api.ODWorker("ot-config-reload:config-reload-result", 0, async (instance, params, source) => {
            const { checkerResult } = params;
            const embeds: api.ODEmbedBuildResult[] = [];
            if (checkerResult.valid) {
                try {
                    const embed = await opendiscord.builders.embeds.getSafe("ot-config-reload:config-reload-success").build(source, {});
                    embeds.push(embed);
                } catch (err) {
                    opendiscord.log(`Error building embed for valid configuration: ${err}`, "error");
                }
            } else {
                try {
                    const embed = await opendiscord.builders.embeds.getSafe("ot-config-reload:config-reload-failure").build(source, {  });
                    embeds.push(embed);
                } catch (err) {
                    opendiscord.log(`Error building embed for invalid configuration: ${err}`, "error");
                }
            }
            if(checkerResult.messages.length > 0) {
                const messages = checkerResult.messages.filter((message) => message.type !== "info");
                if(messages.length > 25) {
                    const embed = await opendiscord.builders.embeds.getSafe("ot-config-reload:config-reload-result").build(source, { messages: messages.slice(0, 25), nEmbed: 1 });
                    embeds.push(embed);
                    for(let i = 25; i < messages.length; i+=25) {
                        const embed = await opendiscord.builders.embeds.getSafe("ot-config-reload:config-reload-result").build(source, { messages: messages.slice(i, i+25), nEmbed: i/25+1 });
                        embeds.push(embed);
                    }
                } else if (messages.length > 0) {
                    const embed = await opendiscord.builders.embeds.getSafe("ot-config-reload:config-reload-result").build(source, { messages: messages });
                    embeds.push(embed);
                }
            }

            try {
                embeds.forEach((embed) => {
                    instance.addEmbed(embed);
                });
                instance.setEphemeral(true);
            } catch (err) {
                opendiscord.log(`Error setting embeds: ${err}`, "error");
            }
        })
    );
});

//EMBED BUILDERS
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("ot-config-reload:config-reload-result"));
    embeds.get("ot-config-reload:config-reload-result").workers.add(
        new api.ODWorker("ot-config-reload:config-reload-result", 0, async (instance, params, source) => {
            const { messages, nEmbed } = params;
            instance.setTitle(nEmbed ? `Config Reload Result (${nEmbed})` : 'Config Reload Result');
            const hasErrors = messages.some((message) => message.type === "error");
            instance.setColor(hasErrors ? "Red" : opendiscord.configs.get("opendiscord:general").data.mainColor);
            messages.forEach((message, index) => {
                const fieldMessage = `${message.message}\n=> ${message.filepath}: ${message.path}`
                instance.addFields({ name: `[${message.type.toUpperCase()}]`, value: fieldMessage });
            });
        })
    );

    embeds.add(new api.ODEmbed("ot-config-reload:config-reload-failure"));
    embeds.get("ot-config-reload:config-reload-failure").workers.add(
        new api.ODWorker("ot-config-reload:config-reload-failure", 0, async (instance, params, source) => {
            instance.setTitle(`Config Reload Failed`);
            instance.setDescription("Please correct the following errors and try again.");
            instance.setColor("Red");
        })
    );

    embeds.add(new api.ODEmbed("ot-config-reload:config-reload-success"));
    embeds.get("ot-config-reload:config-reload-success").workers.add(
        new api.ODWorker("ot-config-reload:config-reload-success", 0, async (instance, params, source) => {
            instance.setTitle(`Config Reloaded Successfully`);
            instance.setDescription("The configuration has been reloaded successfully!");
            instance.setColor("Green");
        })
    );
});

// PANEL COMMAND
/* Update the panel command options to match the new panels */
async function reloadPanelCommand() {
    const panelChoices: { name: string, value: string }[] = [];
    try {
        opendiscord.configs.get("opendiscord:panels").data.forEach((panel) => {
            panelChoices.push({ name: panel.name, value: panel.id });
        });
    } catch (err) {
        opendiscord.log(`Error fetching panel config: ${err}`, "error");
        return;
    }

    const newOptions: discord.ApplicationCommandOptionData[] = [
        {
            name: "id",
            description: lang.getTranslation("commands.panelId"),
            type: acot.String,
            required: true,
            choices: panelChoices
        },
        {
            name: "auto-update",
            description: lang.getTranslation("commands.panelAutoUpdate"),
            type: acot.Boolean,
            required: false
        }
    ];

    try {
        const commands = opendiscord.client.client.application.commands.cache;
        commands.forEach((cmd) => {
            if (cmd.name === 'panel') {
                cmd.setOptions(newOptions);
            }
        });
    } catch (error) {
        opendiscord.log(`Error updating panel command: ${error}`, "error");
    }
}

// MOVE COMMAND
/* Update the move command options to match the new options */
async function reloadMoveCommand() {
    const ticketChoices: { name: string, value: string }[] = [];
    try {
        opendiscord.configs.get("opendiscord:options").data.forEach((option) => {
            if (option.type !== "ticket") return;
            ticketChoices.push({ name: option.name, value: option.id });
        });
    } catch (err) {
        opendiscord.log(`Error fetching options config: ${err}`, "error");
        return;
    }

    const newOptions: discord.ApplicationCommandOptionData[] = [
        {
            name: "id",
            description: lang.getTranslation("commands.moveId"),
            type: acot.String,
            required: true,
            choices: ticketChoices
        },
        {
            name: "reason",
            description: lang.getTranslation("commands.reason"),
            type: acot.String,
            required: false
        }
    ];

    try {
        const commands = opendiscord.client.client.application.commands.cache;
        commands.forEach((cmd) => {
            if (cmd.name === 'move') {
                cmd.setOptions(newOptions);
            }
        });
    } catch (error) {
        opendiscord.log(`Error updating move command: ${error}`, "error");
    }
}

//COMMAND RESPONDERS
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general");

    commands.add(new api.ODCommandResponder("ot-config-reload:reload", generalConfig.data.prefix, "reload"));
    commands.get("ot-config-reload:reload").workers.add(
        new api.ODWorker("ot-config-reload:reload", 0, async (instance, params, source, cancel) => {
            const { guild, channel, user } = instance;

            //check if in guild
            if (!guild){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-not-in-guild").build(source, {channel, user }))
                return cancel()
            }

            //check for permissions
            if (!opendiscord.permissions.hasPermissions("developer",await opendiscord.permissions.getPermissions(user,channel,guild))){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["developer"]}))
                return cancel()
            }

            try {
                const config = instance.options.getString("config", false);
                opendiscord.log(`Reloading configuration: ${config || 'all'}`, "plugin");

                let checkerResult: api.ODCheckerResult;

                switch (config) {
                    case "general": {                      
                        const tempGeneral = new api.ODJsonConfig("ot-config-reload:general", "general.json", getConfigPath());
                        await tempGeneral.init()
                        
                        const generalChecker = opendiscord.checkers.get("opendiscord:general");
                        generalChecker.config = tempGeneral;
                        
                        checkerResult = opendiscord.checkers.checkAll(true)
                        
                        if (checkerResult.valid) {
                            opendiscord.configs.get("opendiscord:general").reload();
                            opendiscord.log('General configuration reloaded successfully.', "plugin");
                        }
                        
                        // Reset the config properties checkers to their original state
                        generalChecker.config = opendiscord.configs.get("opendiscord:general");
                        
                        break;
                    }
                    case "options": {
                        const tempOptions = new api.ODJsonConfig("ot-config-reload:options", "options.json", getConfigPath());
                        await tempOptions.init()

                        const optionsChecker = opendiscord.checkers.get("opendiscord:options");
                        optionsChecker.config = tempOptions;

                        checkerResult = opendiscord.checkers.checkAll(true)

                        if (checkerResult.valid) {
                            opendiscord.configs.get("opendiscord:options").reload();
                            await reloadMoveCommand();
                            opendiscord.log('Options configuration reloaded successfully.', "plugin");
                        }

                        // Reset the config properties checkers to their original state
                        optionsChecker.config = opendiscord.configs.get("opendiscord:options");

                        break;
                    }
                    case "panels": {
                        const tempPanels = new api.ODJsonConfig("ot-config-reload:panels", "panels.json", getConfigPath());
                        await tempPanels.init()

                        const panelsChecker = opendiscord.checkers.get("opendiscord:panels");
                        panelsChecker.config = tempPanels;

                        checkerResult = opendiscord.checkers.checkAll(true)

                        if (checkerResult.valid) {
                            opendiscord.configs.get("opendiscord:panels").reload();
                            await reloadPanelCommand();
                            opendiscord.log('Panels configuration reloaded successfully.', "plugin");
                        }

                        // Reset the config properties checkers to their original state
                        panelsChecker.config = opendiscord.configs.get("opendiscord:panels");
                        
                        break;
                    }
                    case "questions": {
                        const tempQuestions = new api.ODJsonConfig("ot-config-reload:questions", "questions.json", getConfigPath());
                        await tempQuestions.init()

                        const questionsChecker = opendiscord.checkers.get("opendiscord:questions");
                        questionsChecker.config = tempQuestions;

                        checkerResult = opendiscord.checkers.checkAll(true)

                        if (checkerResult.valid) {
                            opendiscord.configs.get("opendiscord:questions").reload();
                            opendiscord.log('Questions configuration reloaded successfully.', "plugin");
                        }

                        // Reset the config properties checkers to their original state
                        questionsChecker.config = opendiscord.configs.get("opendiscord:questions");
                        
                        break;
                    }
                    case "transcripts": {
                        const tempTranscripts = new api.ODJsonConfig("ot-config-reload:transcripts", "transcripts.json", getConfigPath());
                        await tempTranscripts.init()

                        const transcriptsChecker = opendiscord.checkers.get("opendiscord:transcripts")
                        transcriptsChecker.config = tempTranscripts;

                        checkerResult = opendiscord.checkers.checkAll(true)

                        if (checkerResult.valid) {
                            opendiscord.configs.get("opendiscord:transcripts").reload();
                            opendiscord.log('Transcripts configuration reloaded successfully.', "plugin");
                        }

                        // Reset the config properties checkers to their original state
                        transcriptsChecker.config = opendiscord.configs.get("opendiscord:transcripts");

                        break;
                    }
                    default: {
                        const tempGeneral = new api.ODJsonConfig("ot-config-reload:general", "general.json", getConfigPath());
                        const tempOptions = new api.ODJsonConfig("ot-config-reload:options", "options.json", getConfigPath());
                        const tempPanels = new api.ODJsonConfig("ot-config-reload:panels", "panels.json", getConfigPath());
                        const tempQuestions = new api.ODJsonConfig("ot-config-reload:questions", "questions.json", getConfigPath());
                        const tempTranscripts = new api.ODJsonConfig("ot-config-reload:transcripts", "transcripts.json", getConfigPath());
                    
                        await tempGeneral.init()
                        await tempOptions.init()
                        await tempPanels.init()
                        await tempQuestions.init()
                        await tempTranscripts.init()

                        const generalChecker = opendiscord.checkers.get("opendiscord:general");
                        generalChecker.config = tempGeneral;

                        const optionsChecker = opendiscord.checkers.get("opendiscord:options");
                        optionsChecker.config = tempOptions;

                        const panelsChecker = opendiscord.checkers.get("opendiscord:panels");
                        panelsChecker.config = tempPanels;

                        const questionsChecker = opendiscord.checkers.get("opendiscord:questions");
                        questionsChecker.config = tempQuestions;

                        const transcriptsChecker = opendiscord.checkers.get("opendiscord:transcripts")
                        transcriptsChecker.config = tempTranscripts;

                        checkerResult = opendiscord.checkers.checkAll(true)

                        if (checkerResult.valid) {
                            opendiscord.configs.get("opendiscord:general").reload();
                            opendiscord.configs.get("opendiscord:options").reload();
                            opendiscord.configs.get("opendiscord:panels").reload();
                            opendiscord.configs.get("opendiscord:questions").reload();
                            opendiscord.configs.get("opendiscord:transcripts").reload();
                            await reloadPanelCommand();
                            await reloadMoveCommand();
                            opendiscord.log('All configurations reloaded successfully.', "plugin");
                        }

                        // Reset the config properties checkers to their original state
                        generalChecker.config = opendiscord.configs.get("opendiscord:general");
                        optionsChecker.config = opendiscord.configs.get("opendiscord:options");
                        panelsChecker.config = opendiscord.configs.get("opendiscord:panels");
                        questionsChecker.config = opendiscord.configs.get("opendiscord:questions");
                        transcriptsChecker.config = opendiscord.configs.get("opendiscord:transcripts");

                        break;
                    }
                }

                const replyMessage = await opendiscord.builders.messages.getSafe("ot-config-reload:config-reload-result").build(source, { checkerResult });
                instance.reply(replyMessage);

            } catch (error) {
                opendiscord.log(`Error executing reload command: ${error}`, "error");

                const errorReply = await opendiscord.builders.messages.getSafe("opendiscord:error").build(source, { guild, channel, user, error: error.message, layout: "advanced" });
                instance.reply(errorReply);

                return cancel();
            }
        })
    );
    commands.get("ot-config-reload:reload").workers.add(new api.ODWorker("ot-config-reload:logs",-1,(instance,params,source,cancel) => {
        opendiscord.log(instance.user.displayName+" used the 'reload' command!","info",[
            {key:"user",value:instance.user.username},
            {key:"userid",value:instance.user.id,hidden:true},
            {key:"channelid",value:instance.channel.id,hidden:true},
            {key:"method",value:source}
        ])
    }))
})