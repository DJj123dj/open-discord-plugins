import {api, openticket, utilities} from "../../src/index"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
export class OTKillSwitchManager extends api.ODManagerData {
    enabled: boolean = false
}

declare module "../../src/core/api/api.js" {
    export interface ODSlashCommandManagerIds_Default {
        "ot-kill-switch:kill":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-kill-switch:kill":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-kill-switch:kill":{source:"slash"|"text",params:{},workers:"ot-kill-switch:kill"|"ot-kill-switch:logs"},
    }
    export interface ODMessageManagerIds_Default {
        "ot-kill-switch:kill-message":{source:"slash"|"text"|"other",params:{enabled:boolean,user:discord.User},workers:"ot-kill-switch:kill-message"},
        "ot-kill-switch:active-message":{source:"slash"|"text"|"button"|"dropdown"|"other",params:{},workers:"ot-kill-switch:active-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-kill-switch:kill-embed":{source:"slash"|"text"|"other",params:{enabled:boolean,user:discord.User},workers:"ot-kill-switch:kill-embed"},
        "ot-kill-switch:active-embed":{source:"slash"|"text"|"button"|"dropdown"|"other",params:{},workers:"ot-kill-switch:active-embed"},
    }
    export interface ODPluginClassManagerIds_Default {
        "ot-kill-switch:manager":OTKillSwitchManager,
    }
}

//REGISTER MANAGER CLASS
openticket.events.get("onPluginClassLoad").listen((classes) => {
    classes.add(new OTKillSwitchManager("ot-kill-switch:manager"))
})

//REGISTER SLASH COMMAND
openticket.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("ot-kill-switch:kill",{
        name:"kill",
        description:"Temporarily disable the ability to create tickets",
        type:discord.ApplicationCommandType.ChatInput,
        options:[
            {
                type:discord.ApplicationCommandOptionType.Boolean,
                required:true,
                name:"enabled",
                description:"Enable/disable the kill switch."
            }
        ]
    }))
})

//REGISTER TEXT COMMAND
openticket.events.get("onTextCommandLoad").listen((text) => {
    const generalConfig = openticket.configs.get("openticket:general")

    text.add(new api.ODTextCommand("ot-kill-switch:kill",{
        name:"kill",
        prefix:generalConfig.data.prefix,
        dmPermission:false,
        guildPermission:true,
        options:[
            {
                type:"boolean",
                required:true,
                name:"enabled"
            }
        ]
    }))
})

//REGISTER HELP MENU
openticket.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("openticket:extra").add(new api.ODHelpMenuCommandComponent("ot-kill-switch:kill",0,{
        slashName:"kill",
        textName:"kill",
        slashDescription:"Enable/disable the kill switch.",
        textDescription:"Enable/disable the kill switch.",
        textOptions:[{name:"enabled",optional:false}],
        slashOptions:[{name:"enabled",optional:false}]
    }))
})

//REGISTER EMBED BUILDER
openticket.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("ot-kill-switch:kill-embed"))
    embeds.get("ot-kill-switch:kill-embed").workers.add(
        new api.ODWorker("ot-kill-switch:kill-embed",0,(instance,params,source,cancel) => {
            const generalConfig = openticket.configs.get("openticket:general")
            instance.setTitle(utilities.emojiTitle("💀","Kill Switch "+(params.enabled ? "Enabled" : "Disabled")))
            instance.setColor(generalConfig.data.mainColor)
            instance.setDescription("The kill switch has been "+(params.enabled ? "enabled" : "disabled")+"!")
            instance.setAuthor(params.user.displayName,params.user.displayAvatarURL())
            
            if (params.enabled) instance.addFields({name:"What will this do?",value:"This will temporarily prevent anyone from creating tickets."})
        })
    )

    embeds.add(new api.ODEmbed("ot-kill-switch:active-embed"))
    embeds.get("ot-kill-switch:active-embed").workers.add(
        new api.ODWorker("ot-kill-switch:active-embed",0,(instance,params,source,cancel) => {
            const generalConfig = openticket.configs.get("openticket:general")
            instance.setTitle(utilities.emojiTitle("❌","Temporary Ticket Cooldown!"))
            instance.setColor(generalConfig.data.system.useRedErrorEmbeds ? "Red" : generalConfig.data.mainColor)
            instance.setDescription("The server is currently in a temporary ticket cooldown! Due to this, no-one is able to create tickets at the moment.")
            instance.setFooter(openticket.languages.getTranslation("errors.descriptions.askForInfo"))
        })
    )
})

//REGISTER MESSAGE BUILDER
openticket.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-kill-switch:kill-message"))
    messages.get("ot-kill-switch:kill-message").workers.add(
        new api.ODWorker("ot-kill-switch:kill-message",0,async (instance,params,source,cancel) => {
            const {enabled,user} = params
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-kill-switch:kill-embed").build(source,{enabled,user}))
        })
    )

    messages.add(new api.ODMessage("ot-kill-switch:active-message"))
    messages.get("ot-kill-switch:active-message").workers.add(
        new api.ODWorker("ot-kill-switch:active-message",0,async (instance,params,source,cancel) => {
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-kill-switch:active-embed").build(source,{}))
            instance.setEphemeral(true)
        })
    )
})

//REGISTER COMMAND RESPONDER
openticket.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = openticket.configs.get("openticket:general")
    const manager = openticket.plugins.classes.get("ot-kill-switch:manager")

    commands.add(new api.ODCommandResponder("ot-kill-switch:kill",generalConfig.data.prefix,"kill"))
    commands.get("ot-kill-switch:kill").workers.add([
        new api.ODWorker("openticket:permissions",1,async (instance,params,source,cancel) => {
            if (!openticket.permissions.hasPermissions("admin",await openticket.permissions.getPermissions(instance.user,instance.channel,instance.guild,{allowChannelRoleScope:false,allowChannelUserScope:false,allowGlobalRoleScope:true,allowGlobalUserScope:true}))){
                //no permissions
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin"]}))
                return cancel()
            }
        }),
        new api.ODWorker("ot-kill-switch:kill",0,async (instance,params,source,cancel) => {
            const {guild,channel,user,options} = instance
            if (!guild){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-not-in-guild").build("button",{channel,user}))
                return cancel()
            }

            //switch & reply
            const newValue = options.getBoolean("enabled",true)
            manager.enabled = newValue
            await instance.reply(await openticket.builders.messages.getSafe("ot-kill-switch:kill-message").build(source,{enabled:newValue,user}))
        }),
        new api.ODWorker("ot-kill-switch:logs",-1,(instance,params,source,cancel) => {
            openticket.log(instance.user.displayName+" used the 'kill' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source},
                {key:"enabled",value:openticket.plugins.classes.get("ot-kill-switch:manager").enabled.toString()}
            ])
        })
    ])
})

//DISABLE COMMAND RESPONDER (on ticket creation)
openticket.events.get("afterCommandRespondersLoaded").listen((commands) => {
    commands.get("openticket:ticket").workers.add(new api.ODWorker("ot-kill-switch:switch",2,async (instance,params,source,cancel) => {
        if (openticket.plugins.classes.get("ot-kill-switch:manager").enabled){
            instance.reply(await openticket.builders.messages.getSafe("ot-kill-switch:active-message").build(source,{}))
            return cancel()
        }
    }))
})

//DISABLE BUTTON RESPONDER (on ticket creation)
openticket.events.get("afterButtonRespondersLoaded").listen((buttons) => {
    buttons.get("openticket:ticket-option").workers.add(new api.ODWorker("ot-kill-switch:switch",2,async (instance,params,source,cancel) => {
        if (openticket.plugins.classes.get("ot-kill-switch:manager").enabled){
            instance.reply(await openticket.builders.messages.getSafe("ot-kill-switch:active-message").build(source,{}))
            return cancel()
        }
    }))
})

//DISABLE DROPDOWN RESPONDER (on ticket creation)
openticket.events.get("afterDropdownRespondersLoaded").listen((dropdowns) => {
    dropdowns.get("openticket:panel-dropdown-tickets").workers.add(new api.ODWorker("ot-kill-switch:switch",2,async (instance,params,source,cancel) => {
        if (openticket.plugins.classes.get("ot-kill-switch:manager").enabled){
            instance.reply(await openticket.builders.messages.getSafe("ot-kill-switch:active-message").build(source,{}))
            return cancel()
        }
    }))
})