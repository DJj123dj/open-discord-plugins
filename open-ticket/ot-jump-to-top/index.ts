import {api, openticket, utilities} from "../../src/index"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "../../src/core/api/api.js" {
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
openticket.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("ot-jump-to-top:top",{
        name:"top",
        description:"Jump to the top of the ticket.",
        type:discord.ApplicationCommandType.ChatInput
    }))
})

//REGISTER TEXT COMMAND
openticket.events.get("onTextCommandLoad").listen((text) => {
    const generalConfig = openticket.configs.get("openticket:general")

    text.add(new api.ODTextCommand("ot-jump-to-top:top",{
        name:"top",
        prefix:generalConfig.data.prefix,
        dmPermission:false,
        guildPermission:true
    }))
})

//REGISTER HELP MENU
openticket.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("openticket:extra").add(new api.ODHelpMenuCommandComponent("ot-jump-to-top:top",0,{
        slashName:"top",
        textName:"top",
        slashDescription:"Jump to the top of the ticket.",
        textDescription:"Jump to the top of the ticket."
    }))
})

//REGISTER BUILDERS
openticket.events.get("onButtonBuilderLoad").listen((buttons) => {
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
openticket.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-jump-to-top:top-message"))
    messages.get("ot-jump-to-top:top-message").workers.add(
        new api.ODWorker("ot-jump-to-top:top-message",0,async (instance,params,source,cancel) => {
            instance.addComponent(await openticket.builders.buttons.getSafe("ot-jump-to-top:top-button").build(source,{url:params.url}))
            instance.setContent("**Click to go to the top of this ticket.**")
        })
    )
})

//REGISTER COMMAND RESPONDER
openticket.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = openticket.configs.get("openticket:general")

    commands.add(new api.ODCommandResponder("ot-jump-to-top:top",generalConfig.data.prefix,"top"))
    commands.get("ot-jump-to-top:top").workers.add([
        new api.ODWorker("ot-jump-to-top:top",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            if (!guild){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-not-in-guild").build("button",{channel,user}))
                return cancel()
            }
            const ticket = openticket.tickets.get(channel.id)
            if (!ticket || channel.isDMBased()){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-ticket-unknown").build("button",{guild,channel,user}))
                return cancel()
            }
            //return when busy
            if (ticket.get("openticket:busy").value){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-ticket-busy").build("button",{guild,channel,user}))
                return cancel()
            }

            const msg = await openticket.tickets.getTicketMessage(ticket)
            if (!msg){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error").build("button",{guild,channel,user,error:"Unable to find ticket message!",layout:"simple"}))
                return cancel()
            }

            await instance.reply(await openticket.builders.messages.getSafe("ot-jump-to-top:top-message").build(source,{url:msg.url}))
        }),
        new api.ODWorker("ot-jump-to-top:logs",-1,(instance,params,source,cancel) => {
            openticket.log(instance.user.displayName+" used the 'top' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source}
            ])
        })
    ])
})