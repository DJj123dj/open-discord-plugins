import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-jump-to-top":api.ODPlugin
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-jump-to-top:top":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-jump-to-top:top":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-jump-to-top:top":{source:"slash"|"text",params:{},workers:"ot-jump-to-top:top"|"ot-jump-to-top:logs"},
    }
    export interface ODButtonManagerIds_Default {
        "ot-jump-to-top:top-button":{source:"slash"|"text"|"other",params:{url:string},workers:"ot-jump-to-top:top-button"},
    }
    export interface ODMessageManagerIds_Default {
        "ot-jump-to-top:top-message":{source:"slash"|"text"|"other",params:{url:string},workers:"ot-jump-to-top:top-message"},
    }
}

//REGISTER SLASH COMMAND
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("ot-jump-to-top:top",{
        name:"top",
        description:"Jump to the top of the ticket.",
        type:discord.ApplicationCommandType.ChatInput,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall]
    }))
})

//REGISTER TEXT COMMAND
opendiscord.events.get("onTextCommandLoad").listen((text) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    text.add(new api.ODTextCommand("ot-jump-to-top:top",{
        name:"top",
        prefix:generalConfig.data.prefix,
        dmPermission:false,
        guildPermission:true
    }))
})

//REGISTER HELP MENU
opendiscord.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("ot-jump-to-top:top",0,{
        slashName:"top",
        textName:"top",
        slashDescription:"Jump to the top of the ticket.",
        textDescription:"Jump to the top of the ticket."
    }))
})

//REGISTER BUILDERS
opendiscord.events.get("onButtonBuilderLoad").listen((buttons) => {
    buttons.add(new api.ODButton("ot-jump-to-top:top-button"))
    buttons.get("ot-jump-to-top:top-button").workers.add(
        new api.ODWorker("ot-jump-to-top:top-button",0,(instance,params,source,cancel) => {
            instance.setMode("url")
            instance.setUrl(params.url)
            instance.setEmoji("⬆️")
            instance.setLabel("Back To Top")
        })
    )
})
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-jump-to-top:top-message"))
    messages.get("ot-jump-to-top:top-message").workers.add(
        new api.ODWorker("ot-jump-to-top:top-message",0,async (instance,params,source,cancel) => {
            instance.addComponent(await opendiscord.builders.buttons.getSafe("ot-jump-to-top:top-button").build(source,{url:params.url}))
            instance.setContent("**Click to go to the top of this ticket.**")
        })
    )
})

//REGISTER COMMAND RESPONDER
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    commands.add(new api.ODCommandResponder("ot-jump-to-top:top",generalConfig.data.prefix,"top"))
    commands.get("ot-jump-to-top:top").workers.add([
        new api.ODWorker("ot-jump-to-top:top",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            if (!guild){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-not-in-guild").build(source,{channel,user}))
                return cancel()
            }
            const ticket = opendiscord.tickets.get(channel.id)
            if (!ticket || channel.isDMBased()){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-ticket-unknown").build(source,{guild,channel,user}))
                return cancel()
            }
            //return when busy
            if (ticket.get("opendiscord:busy").value){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-ticket-busy").build(source,{guild,channel,user}))
                return cancel()
            }

            const msg = await opendiscord.tickets.getTicketMessage(ticket)
            if (!msg){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"Unable to find ticket message!",layout:"simple"}))
                return cancel()
            }

            await instance.reply(await opendiscord.builders.messages.getSafe("ot-jump-to-top:top-message").build(source,{url:msg.url}))
        }),
        new api.ODWorker("ot-jump-to-top:logs",-1,(instance,params,source,cancel) => {
            opendiscord.log(instance.user.displayName+" used the 'top' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source}
            ])
        })
    ])
})