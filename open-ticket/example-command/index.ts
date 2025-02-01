import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "example-command":api.ODPlugin
    }
    export interface ODSlashCommandManagerIds_Default {
        "example-command:ping":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "example-command:ping":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "example-command:ping":{source:"slash"|"text",params:{},workers:"example-command:ping"|"example-command:logs"},
    }
    export interface ODMessageManagerIds_Default {
        "example-command:ping-message":{source:"slash"|"text"|"other",params:{},workers:"example-command:ping-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "example-command:ping-embed":{source:"slash"|"text"|"other",params:{},workers:"example-command:ping-embed"},
    }
}

//REGISTER SLASH COMMAND
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("example-command:ping",{
        name:"ping",
        description:"Pong!",
        type:discord.ApplicationCommandType.ChatInput,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall]
    }))
})

//REGISTER TEXT COMMAND
opendiscord.events.get("onTextCommandLoad").listen((text) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    text.add(new api.ODTextCommand("example-command:ping",{
        name:"ping",
        prefix:generalConfig.data.prefix,
        dmPermission:false,
        guildPermission:true
    }))
})

//REGISTER HELP MENU
opendiscord.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("example-command:ping",0,{
        slashName:"ping",
        textName:"ping",
        slashDescription:"Test Command!",
        textDescription:"Test Command!"
    }))
})

//REGISTER EMBED BUILDER
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("example-command:ping-embed"))
    embeds.get("example-command:ping-embed").workers.add(
        new api.ODWorker("example-command:ping-embed",0,(instance,params,source,cancel) => {
            const generalConfig = opendiscord.configs.get("opendiscord:general")
            instance.setTitle("Pong!")
            instance.setColor(generalConfig.data.mainColor)
            instance.setDescription("You've now used the example command!")
        })
    )
})

//REGISTER MESSAGE BUILDER
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("example-command:ping-message"))
    messages.get("example-command:ping-message").workers.add(
        new api.ODWorker("example-command:ping-message",0,async (instance,params,source,cancel) => {
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("example-command:ping-embed").build(source,{}))
        })
    )
})

//REGISTER COMMAND RESPONDER
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    commands.add(new api.ODCommandResponder("example-command:ping",generalConfig.data.prefix,"ping"))
    commands.get("example-command:ping").workers.add([
        new api.ODWorker("example-command:ping",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            if (!guild){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-not-in-guild").build(source,{channel,user}))
                return cancel()
            }
            await instance.reply(await opendiscord.builders.messages.getSafe("example-command:ping-message").build(source,{}))
        }),
        new api.ODWorker("example-command:logs",-1,(instance,params,source,cancel) => {
            opendiscord.log(instance.user.displayName+" used the 'ping' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source}
            ])
        })
    ])
})