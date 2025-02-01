import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
import crypto from "crypto"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-migrate-v3":api.ODPlugin
    }
    export interface ODButtonManagerIds_Default {
        "ot-migrate-v3:migrate-button":{source:"other",params:{},workers:"ot-migrate-v3:migrate-button"},
    }
    export interface ODMessageManagerIds_Default {
        "ot-migrate-v3:migrate-message":{source:"other",params:{},workers:"ot-migrate-v3:migrate-message"},
        "ot-migrate-v3:success-message":{source:"other",params:{},workers:"ot-migrate-v3:success-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-migrate-v3:migrate-embed":{source:"other",params:{},workers:"ot-migrate-v3:migrate-embed"},
        "ot-migrate-v3:success-embed":{source:"other",params:{},workers:"ot-migrate-v3:success-embed"},
    }
    export interface ODButtonResponderManagerIds_Default {
        "ot-migrate-v3:migrate-button":{source:"button",params:{},workers:"ot-migrate-v3:migrate-button"},
    }
}

//REGISTER BUTTON BUILDERS
opendiscord.events.get("onButtonBuilderLoad").listen((buttons) => {
    buttons.add(new api.ODButton("ot-migrate-v3:migrate-button"))
    buttons.get("ot-migrate-v3:migrate-button").workers.add(
        new api.ODWorker("ot-migrate-v3:migrate-button",0,(instance,params,source,cancel) => {
            instance.setMode("button")
            instance.setColor("red")
            instance.setLabel("Migrate To v4")
            instance.setEmoji("🔀")
            instance.setCustomId("od:migrate-v3-migrate")
        })
    )
})

//REGISTER EMBED BUILDERS
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("ot-migrate-v3:migrate-embed"))
    embeds.get("ot-migrate-v3:migrate-embed").workers.add(
        new api.ODWorker("ot-migrate-v3:migrate-embed",0,(instance,params,source,cancel) => {
            instance.setTitle(utilities.emojiTitle("🔀","Migrate Ticket"))
            instance.setColor("Red")
            instance.setDescription("This channel has been detected as an Open Ticket v3 ticket!\nClick the button below to migrate this ticket to the new version.")
            instance.setFooter("Only admins are able to run this action!")
        })
    )
    embeds.add(new api.ODEmbed("ot-migrate-v3:success-embed"))
    embeds.get("ot-migrate-v3:success-embed").workers.add(
        new api.ODWorker("ot-migrate-v3:success-embed",0,(instance,params,source,cancel) => {
            const generalConfig = opendiscord.configs.get("opendiscord:general")
            instance.setTitle(utilities.emojiTitle("🔀","Ticket Migrated Succesfully!"))
            instance.setColor(generalConfig.data.mainColor)
            instance.setDescription("This ticket has been migrated to Open Ticket v4 successfully!")
            instance.setFooter("This ticket can now be used like any other ticket!")
            instance.addFields({name:"Misbehaviour:",value:"Please be aware that some commands or functions might not work as intended because the data in the database is only partially available."})
        })
    )
})

//REGISTER MESSAGE BUILDERS
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-migrate-v3:migrate-message"))
    messages.get("ot-migrate-v3:migrate-message").workers.add(
        new api.ODWorker("ot-migrate-v3:migrate-message",0,async (instance,params,source,cancel) => {
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-migrate-v3:migrate-embed").build(source,{}))
            instance.addComponent(await opendiscord.builders.buttons.getSafe("ot-migrate-v3:migrate-button").build(source,{}))
        })
    )
    messages.add(new api.ODMessage("ot-migrate-v3:success-message"))
    messages.get("ot-migrate-v3:success-message").workers.add(
        new api.ODWorker("ot-migrate-v3:success-message",0,async (instance,params,source,cancel) => {
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-migrate-v3:success-embed").build(source,{}))

            //add disabled transfer button
            const migrateButton = await opendiscord.builders.buttons.getSafe("ot-migrate-v3:migrate-button").build(source,{})
            if (migrateButton.component && typeof migrateButton.component != "string") migrateButton.component.setDisabled(true)
            instance.addComponent(migrateButton)
        })
    )
})

//DETECT TICKETS
opendiscord.events.get("onReadyForUsage").listen(async () => {
    const client = opendiscord.client.client
    const mainServer = opendiscord.client.mainServer
    if (!mainServer) return opendiscord.log("Unable to detect v3 tickets because server couldn't be found!","error")

    const channels = await mainServer.channels.fetch()
    channels.forEach(async (channel) => {
        if (!channel ||!channel.isTextBased()) return
        if (channel.type != discord.ChannelType.GuildText) return

        //detect OTv3 ticket message
        const pinnedMessages = await channel.messages.fetchPinned()
        const ticketMessage = pinnedMessages.find((msg) => msg.author.id == client.user.id && msg.embeds.length > 0)
        if (!ticketMessage) return

        let isTicketMessage = false
        ticketMessage.components.forEach((row) => {
            row.components.forEach((component) => {
                if (["OTdeleteTicket","OTcloseTicket","OTclaimTicket","OTreopenTicket"].some((id) => component.customId && component.customId.startsWith(id))) isTicketMessage = true
            })
        })
        if (!isTicketMessage) return

        //channel is valid OTv3 ticket => send migrate button
        await channel.send((await opendiscord.builders.messages.getSafe("ot-migrate-v3:migrate-message").build("other",{})).message)
        
        opendiscord.log("Found valid Open Ticket v3 channel! Sending migration embed...","plugin",[
            {key:"channel",value:"#"+channel.name},
            {key:"channelid",value:channel.id,hidden:true},
        ])
    })
})

//RESPOND TO MIGRATION
opendiscord.events.get("onButtonResponderLoad").listen((buttons) => {
    buttons.add(new api.ODButtonResponder("ot-migrate-v3:migrate-button",/^od:migrate-v3-migrate$/))
    buttons.get("ot-migrate-v3:migrate-button").workers.add(
        new api.ODWorker("ot-migrate-v3:migrate-button",0,async (instance,params,source,cancel) => {
            const {user,channel,guild,message} = instance
            const optionDatabase = opendiscord.databases.get("opendiscord:options")
            const client = opendiscord.client.client

            //check for guild & permissions
            if (!opendiscord.permissions.hasPermissions("admin",await opendiscord.permissions.getPermissions(user,channel,guild))){
                //no permissions
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-no-permissions").build("button",{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin"]}))
                return cancel()
            }
            if (channel.isDMBased() || channel.type != discord.ChannelType.GuildText || !guild){
                //not in server
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-ticket-unknown").build("button",{guild,channel,user}))
                return cancel()
            }

            await instance.defer("update",false)

            opendiscord.log("Starting ticket migration!","plugin",[
                {key:"channel",value:"#"+channel.name},
                {key:"channelid",value:channel.id,hidden:true},
            ])

            //GET ORIGINAL PROPERTIES
            //detect OTv3 ticket message
            const pinnedMessages = await channel.messages.fetchPinned()
            const ticketMessage = pinnedMessages.find((msg) => msg.author.id == client.user.id && msg.embeds.length > 0)
            if (!ticketMessage) return

            let isTicketMessage = false
            ticketMessage.components.forEach((row) => {
                row.components.forEach((component) => {
                    if (["OTdeleteTicket","OTcloseTicket","OTclaimTicket","OTreopenTicket"].some((id) => component.customId && component.customId.startsWith(id))) isTicketMessage = true
                })
            })
            if (!isTicketMessage){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build("button",{guild,channel,user,layout:"simple",error:"This channel isn't a valid OTv3 ticket!"}))
                return cancel()
            }
            let initialEmbedName = "Transfered Ticket"
            let initialEmbedDescription = "*no description*"
            let initialEmbedColor = ""
            let initialEmbedThumbnail = ""
            let initialEmbedImage = ""
            let initialEmbedFields: discord.APIEmbedField[] = []

            if (ticketMessage.embeds[0]){
                if (ticketMessage.embeds[0].title) initialEmbedName = ticketMessage.embeds[0].title
                if (ticketMessage.embeds[0].description) initialEmbedDescription = ticketMessage.embeds[0].description
                if (ticketMessage.embeds[0].hexColor) initialEmbedColor = ticketMessage.embeds[0].hexColor
                if (ticketMessage.embeds[0].thumbnail) initialEmbedThumbnail = ticketMessage.embeds[0].thumbnail.url
                if (ticketMessage.embeds[0].image) initialEmbedImage = ticketMessage.embeds[0].image.url
                if (ticketMessage.embeds[0].fields) initialEmbedFields = ticketMessage.embeds[0].fields
            }
        
            //MIGRATE TICKET
            //get channel properties
            const channelPrefix = channel.name
            const channelCategory = channel.parent?.id ?? null
            const channelSuffix = ""
            const categoryMode = "normal"
        
            //handle permissions (global admins only)
            const permissions: discord.OverwriteResolvable[] = [{
                type:discord.OverwriteType.Role,
                id:guild.roles.everyone.id,
                allow:[],
                deny:["ViewChannel","SendMessages","ReadMessageHistory"]
            }]

            //add global admins
            const globalAdmins = opendiscord.configs.get("opendiscord:general").data.globalAdmins
            globalAdmins.forEach((admin) => {
                permissions.push({
                    type:discord.OverwriteType.Role,
                    id:admin,
                    allow:["ViewChannel","SendMessages","AddReactions","AttachFiles","SendPolls","ReadMessageHistory","ManageMessages"],
                    deny:[]
                })
            })

            //add user participants
            channel.permissionOverwrites.cache.forEach((overwrite) => {
                if (overwrite.type != discord.OverwriteType.Member) return
                permissions.push({
                    type:discord.OverwriteType.Member,
                    id:overwrite.id,
                    allow:["ViewChannel","SendMessages","AddReactions","AttachFiles","SendPolls","ReadMessageHistory"],
                    deny:[]
                })
            })
            await channel.permissionOverwrites.set(permissions)
            
            //create participants
            const participants: {type:"role"|"user",id:string}[] = []
            permissions.forEach((permission,index) => {
                if (index == 0) return //don't include @everyone
                const type = (permission.type == discord.OverwriteType.Role) ? "role" : "user"
                const id = permission.id as string
                participants.push({type,id})
            })

            //create temporary option
            const option = new api.ODTicketOption(crypto.randomBytes(16).toString("hex"),[
                new api.ODOptionData("opendiscord:name",initialEmbedName),
                new api.ODOptionData("opendiscord:description","This option is made for the transfer of this ticket from v3 to v4."),

                new api.ODOptionData("opendiscord:button-emoji","❌"),
                new api.ODOptionData("opendiscord:button-label","Temporary"),
                new api.ODOptionData("opendiscord:button-color","gray"),
                
                new api.ODOptionData("opendiscord:admins",[]),
                new api.ODOptionData("opendiscord:admins-readonly",[]),
                new api.ODOptionData("opendiscord:allow-blacklisted-users",false),
                new api.ODOptionData("opendiscord:questions",[]),

                new api.ODOptionData("opendiscord:channel-prefix",channelPrefix),
                new api.ODOptionData("opendiscord:channel-suffix","user-name"),
                new api.ODOptionData("opendiscord:channel-category",channelCategory),
                new api.ODOptionData("opendiscord:channel-category-closed",""),
                new api.ODOptionData("opendiscord:channel-category-backup",""),
                new api.ODOptionData("opendiscord:channel-categories-claimed",[]),
                new api.ODOptionData("opendiscord:channel-description",""),
                
                new api.ODOptionData("opendiscord:dm-message-enabled",false),
                new api.ODOptionData("opendiscord:dm-message-text",""),
                new api.ODOptionData("opendiscord:dm-message-embed",{}),

                new api.ODOptionData("opendiscord:ticket-message-enabled",true),
                new api.ODOptionData("opendiscord:ticket-message-text",""),
                new api.ODOptionData("opendiscord:ticket-message-embed",{
                    enabled:true,
                    title:initialEmbedName,
                    description:initialEmbedDescription,
                    customColor:"",
    
                    image:initialEmbedImage,
                    thumbnail:initialEmbedThumbnail,
                    fields:initialEmbedFields,
                    timestamp:false
                }),
                new api.ODOptionData("opendiscord:ticket-message-ping",{
                    "@here":true,
                    "@everyone":false,
                    custom:[]
                }),

                new api.ODOptionData("opendiscord:autoclose-enable-hours",false),
                new api.ODOptionData("opendiscord:autoclose-enable-leave",false),
                new api.ODOptionData("opendiscord:autoclose-disable-claim",false),
                new api.ODOptionData("opendiscord:autoclose-hours",0),

                new api.ODOptionData("opendiscord:autodelete-enable-days",false),
                new api.ODOptionData("opendiscord:autodelete-enable-leave",false),
                new api.ODOptionData("opendiscord:autodelete-disable-claim",false),
                new api.ODOptionData("opendiscord:autodelete-days",0),

                new api.ODOptionData("opendiscord:cooldown-enabled",false),
                new api.ODOptionData("opendiscord:cooldown-minutes",0),

                new api.ODOptionData("opendiscord:limits-enabled",false),
                new api.ODOptionData("opendiscord:limits-maximum-global",0),
                new api.ODOptionData("opendiscord:limits-maximum-user",0)
            ])
            opendiscord.options.add(option)
        
            //create ticket
            const ticket = new api.ODTicket(channel.id,option,[
                new api.ODTicketData("opendiscord:busy",false),
                new api.ODTicketData("opendiscord:ticket-message",null),
                new api.ODTicketData("opendiscord:participants",participants),
                new api.ODTicketData("opendiscord:channel-suffix",channelSuffix),
                
                new api.ODTicketData("opendiscord:open",true),
                new api.ODTicketData("opendiscord:opened-by",null),
                new api.ODTicketData("opendiscord:opened-on",channel.createdAt.getTime()),
                new api.ODTicketData("opendiscord:closed",false),
                new api.ODTicketData("opendiscord:closed-by",null),
                new api.ODTicketData("opendiscord:closed-on",null),
                new api.ODTicketData("opendiscord:claimed",false),
                new api.ODTicketData("opendiscord:claimed-by",null),
                new api.ODTicketData("opendiscord:claimed-on",null),
                new api.ODTicketData("opendiscord:pinned",false),
                new api.ODTicketData("opendiscord:pinned-by",null),
                new api.ODTicketData("opendiscord:pinned-on",null),
                new api.ODTicketData("opendiscord:for-deletion",false),
    
                new api.ODTicketData("opendiscord:category",channelCategory),
                new api.ODTicketData("opendiscord:category-mode",categoryMode),
    
                new api.ODTicketData("opendiscord:autoclose-enabled",option.get("opendiscord:autoclose-enable-hours").value),
                new api.ODTicketData("opendiscord:autoclose-hours",(option.get("opendiscord:autoclose-enable-hours").value ? option.get("opendiscord:autoclose-hours").value : 0)),
                new api.ODTicketData("opendiscord:autoclosed",false),
                new api.ODTicketData("opendiscord:autodelete-enabled",option.get("opendiscord:autodelete-enable-days").value),
                new api.ODTicketData("opendiscord:autodelete-days",(option.get("opendiscord:autodelete-enable-days").value ? option.get("opendiscord:autodelete-days").value : 0)),
    
                new api.ODTicketData("opendiscord:answers",[])
            ])
            opendiscord.tickets.add(ticket)
    
            //manage stats
            await opendiscord.stats.get("opendiscord:global").setStat("opendiscord:tickets-created",1,"increase")
            await opendiscord.stats.get("opendiscord:user").setStat("opendiscord:tickets-created",user.id,1,"increase")

            //edit ticket-message
            await ticketMessage.edit((await opendiscord.builders.messages.getSafe("opendiscord:ticket-message").build("other",{guild,channel,user,ticket})).message)
            ticket.get("opendiscord:ticket-message").value = ticketMessage.id

            await instance.update(await opendiscord.builders.messages.getSafe("ot-migrate-v3:success-message").build("other",{}))

            opendiscord.log("Ticket migrated to v4 successfully!","plugin",[
                {key:"channel",value:"#"+channel.name},
                {key:"channelid",value:channel.id,hidden:true},
            ])
        })
    )
})