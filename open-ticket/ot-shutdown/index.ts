import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-shutdown":api.ODPlugin
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-shutdown:shutdown":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-shutdown:shutdown":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-shutdown:shutdown":{source:"slash"|"text",params:{},workers:"ot-shutdown:shutdown"|"ot-shutdown:logs"},
    }
    export interface ODMessageManagerIds_Default {
        "ot-shutdown:shutdown-message":{source:"slash"|"text"|"other",params:{},workers:"ot-shutdown:shutdown-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-shutdown:shutdown-embed":{source:"slash"|"text"|"other",params:{},workers:"ot-shutdown:shutdown-embed"},
    }
}

//REGISTER SLASH COMMAND
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("ot-shutdown:shutdown",{
        name:"shutdown",
        description:"Turn off the bot by stopping the process! (server & bot owner only)",
        type:discord.ApplicationCommandType.ChatInput,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall]
    }))
})

//REGISTER TEXT COMMAND
opendiscord.events.get("onTextCommandLoad").listen((text) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    text.add(new api.ODTextCommand("ot-shutdown:shutdown",{
        name:"shutdown",
        prefix:generalConfig.data.prefix,
        dmPermission:false,
        guildPermission:true
    }))
})

//REGISTER HELP MENU
opendiscord.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("ot-shutdown:shutdown",0,{
        slashName:"shutdown",
        textName:"shutdown",
        slashDescription:"Turn off the bot!",
        textDescription:"Turn off the bot!"
    }))
})

//REGISTER EMBED BUILDER
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("ot-shutdown:shutdown-embed"))
    embeds.get("ot-shutdown:shutdown-embed").workers.add(
        new api.ODWorker("ot-shutdown:shutdown-embed",0,(instance,params,source,cancel) => {
            const generalConfig = opendiscord.configs.get("opendiscord:general")
            instance.setTitle(utilities.emojiTitle("🪫","Shutdown"))
            instance.setColor(generalConfig.data.mainColor)
            instance.setDescription("The bot will turn off in a few seconds!")
        })
    )
})

//REGISTER MESSAGE BUILDER
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-shutdown:shutdown-message"))
    messages.get("ot-shutdown:shutdown-message").workers.add(
        new api.ODWorker("ot-shutdown:shutdown-message",0,async (instance,params,source,cancel) => {
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-shutdown:shutdown-embed").build(source,{}))
        })
    )
})

//REGISTER COMMAND RESPONDER
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    commands.add(new api.ODCommandResponder("ot-shutdown:shutdown",generalConfig.data.prefix,"shutdown"))
    commands.get("ot-shutdown:shutdown").workers.add([
        new api.ODWorker("opendiscord:permissions",1,async (instance,params,source,cancel) => {
            if (!opendiscord.permissions.hasPermissions("owner",await opendiscord.permissions.getPermissions(instance.user,instance.channel,instance.guild,{allowChannelRoleScope:false,allowChannelUserScope:false,allowGlobalRoleScope:true,allowGlobalUserScope:true}))){
                //no permissions
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin"]}))
                return cancel()
            }
        }),
        new api.ODWorker("ot-shutdown:shutdown",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            if (!guild){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-not-in-guild").build(source,{channel,user}))
                return cancel()
            }
            await instance.reply(await opendiscord.builders.messages.getSafe("ot-shutdown:shutdown-message").build(source,{}))
        }),
        new api.ODWorker("ot-shutdown:logs",-1,(instance,params,source,cancel) => {
            opendiscord.log(instance.user.displayName+" used the 'shutdown' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source}
            ])
        }),
        new api.ODWorker("ot-shutdown:exit-process",-2,async (instance,params,source,cancel) => {
            opendiscord.log("Shutting down the bot...","warning")
            opendiscord.client.activity.setStatus("custom","shutting down...","invisible",true)
            await utilities.timer(2000)
            process.exit(0)
        })
    ])
})