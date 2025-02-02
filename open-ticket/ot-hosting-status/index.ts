import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
export type OTHostingStatusType = "info"|"resolved"|"minor-outage"|"major-outage"|"planned-outage"|"issue"

export interface OTHostingStatusOptions {
    type:OTHostingStatusType,
    ping:discord.GuildMember|discord.User|discord.Role|null,
    title:string,
    details:string,
    guild:discord.Guild
}

declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-hosting-status":api.ODPlugin
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-hosting-status:hosting":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-hosting-status:hosting":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-hosting-status:hosting":{source:"slash"|"text",params:{},workers:"ot-hosting-status:hosting"|"ot-hosting-status:logs"},
    }
    export interface ODMessageManagerIds_Default {
        "ot-hosting-status:hosting-message":{source:"slash"|"text"|"other",params:{data:OTHostingStatusOptions},workers:"ot-hosting-status:hosting-message"},
        "ot-hosting-status:reply-message":{source:"slash"|"text"|"other",params:{},workers:"ot-hosting-status:reply-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-hosting-status:hosting-embed":{source:"slash"|"text"|"other",params:{data:OTHostingStatusOptions},workers:"ot-hosting-status:hosting-embed"},
        "ot-hosting-status:reply-embed":{source:"slash"|"text"|"other",params:{},workers:"ot-hosting-status:reply-embed"},
    }
}

//REGISTER SLASH COMMAND
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("ot-hosting-status:hosting",{
        name:"hosting",
        description:"Send a hosting status update to a channel.",
        type:discord.ApplicationCommandType.ChatInput,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall],
        options:[
            {
                type:discord.ApplicationCommandOptionType.Channel,
                channelTypes:[discord.ChannelType.GuildAnnouncement,discord.ChannelType.GuildText],
                name:"channel",
                description:"The channel to send the message to.",
                required:true
            },
            {
                type:discord.ApplicationCommandOptionType.String,
                name:"type",
                description:"The type of hosting status update.",
                required:true,
                choices:[
                    {name:"Info",value:"info"},
                    {name:"Resolved",value:"resolved"},
                    {name:"Minor Outage",value:"minor-outage"},
                    {name:"Major Outage",value:"major-outage"},
                    {name:"Planned Outage",value:"planned-outage"},
                    {name:"Issue",value:"issue"}
                ]
            },
            {
                type:discord.ApplicationCommandOptionType.String,
                name:"title",
                description:"The title of the hosting status update.",
                required:true
            },
            {
                type:discord.ApplicationCommandOptionType.String,
                name:"details",
                description:"The details of this hosting status update.",
                required:true
            },
            {
                type:discord.ApplicationCommandOptionType.Mentionable,
                name:"ping",
                description:"The role/user to ping with this hosting status update.",
                required:false
            }
        ]
    }))
})

//REGISTER HELP MENU
opendiscord.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("ot-hosting-status:hosting",0,{
        slashName:"hosting",
        slashDescription:"Send a hosting status update to a channel!",
    }))
})

//REGISTER EMBED BUILDERS
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("ot-hosting-status:hosting-embed"))
    embeds.get("ot-hosting-status:hosting-embed").workers.add(
        new api.ODWorker("ot-hosting-status:hosting-embed",0,(instance,params,source,cancel) => {
            const {data} = params

            const color: discord.ColorResolvable = (data.type == "info") ? "Blue" : (data.type == "resolved") ? "Green" : (data.type == "planned-outage") ? "Yellow" : (data.type == "issue") ? "Orange" : "Red"
            const emoji = (data.type == "info") ? "ℹ️" : (data.type == "resolved") ? "✅" : (data.type == "planned-outage") ? "🔧" : (data.type == "issue") ? "⚠️" : "❌"
            const type = (data.type == "info") ? "Info" : (data.type == "resolved") ? "Resolved" : (data.type == "planned-outage") ? "Planned Outage" : (data.type == "issue") ? "Issue" : (data.type == "major-outage") ? "Major Outage" : "Minor Outage"
            
            instance.setTitle(data.title)
            instance.setColor(color)
            instance.setDescription(data.details)
            instance.setAuthor(utilities.emojiTitle(emoji,type))
            instance.setFooter(data.guild.name,data.guild.iconURL())
            instance.setTimestamp(new Date())
        })
    )

    embeds.add(new api.ODEmbed("ot-hosting-status:reply-embed"))
    embeds.get("ot-hosting-status:reply-embed").workers.add(
        new api.ODWorker("ot-hosting-status:reply-embed",0,(instance,params,source,cancel) => {
            const generalConfig = opendiscord.configs.get("opendiscord:general")
            instance.setTitle(utilities.emojiTitle("✅","Hosting Status Sent"))
            instance.setColor(generalConfig.data.mainColor)
            instance.setDescription("The hosting status update has been sent to the channel successfully!")
        })
    )
})

//REGISTER MESSAGE BUILDERS
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-hosting-status:hosting-message"))
    messages.get("ot-hosting-status:hosting-message").workers.add(
        new api.ODWorker("ot-hosting-status:hosting-message",0,async (instance,params,source,cancel) => {
            const {data} = params
            
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-hosting-status:hosting-embed").build(source,{data}))

            if (data.ping instanceof discord.Role) instance.setContent(discord.roleMention(data.ping.id))
            else if (data.ping instanceof discord.GuildMember || data.ping instanceof discord.User) instance.setContent(discord.userMention(data.ping.id))
        })
    )

    messages.add(new api.ODMessage("ot-hosting-status:reply-message"))
    messages.get("ot-hosting-status:reply-message").workers.add(
        new api.ODWorker("ot-hosting-status:reply-message",0,async (instance,params,source,cancel) => {
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-hosting-status:reply-embed").build(source,{}))
            instance.setEphemeral(true)
        })
    )
})

//REGISTER COMMAND RESPONDER
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    commands.add(new api.ODCommandResponder("ot-hosting-status:hosting",generalConfig.data.prefix,"hosting"))
    commands.get("ot-hosting-status:hosting").workers.add([
        new api.ODWorker("ot-hosting-status:hosting",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance

            //check for guild & permissions
            if (!opendiscord.permissions.hasPermissions("admin",await opendiscord.permissions.getPermissions(user,channel,guild))){
                //no permissions
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin"]}))
                return cancel()
            }
            //check if in guild
            if (!guild){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-not-in-guild").build(source,{channel,user}))
                return cancel()
            }

            const channelOpt = instance.options.getChannel("channel",true) as discord.GuildTextBasedChannel
            const typeOpt = instance.options.getString("type",true) as OTHostingStatusType
            const titleOpt = instance.options.getString("title",true)
            const detailsOpt = instance.options.getString("details",true)
            const pingOpt = instance.options.getMentionable("ping",false)

            await channelOpt.send((await opendiscord.builders.messages.getSafe("ot-hosting-status:hosting-message").build(source,{data:{
                title:titleOpt,
                details:detailsOpt,
                type:typeOpt,
                ping:pingOpt,
                guild
            }})).message)

            await instance.reply(await opendiscord.builders.messages.getSafe("ot-hosting-status:reply-message").build(source,{}))
        }),
        new api.ODWorker("ot-hosting-status:logs",-1,(instance,params,source,cancel) => {
            opendiscord.log(instance.user.displayName+" used the 'hosting' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source}
            ])
        })
    ])
})