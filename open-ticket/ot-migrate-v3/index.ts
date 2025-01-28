import {api, openticket, utilities} from "#opendiscord"
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
openticket.events.get("onButtonBuilderLoad").listen((buttons) => {
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
openticket.events.get("onEmbedBuilderLoad").listen((embeds) => {
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
            const generalConfig = openticket.configs.get("openticket:general")
            instance.setTitle(utilities.emojiTitle("🔀","Ticket Migrated Succesfully!"))
            instance.setColor(generalConfig.data.mainColor)
            instance.setDescription("This ticket has been migrated to Open Ticket v4 successfully!")
            instance.setFooter("This ticket can now be used like any other ticket!")
            instance.addFields({name:"Misbehaviour:",value:"Please be aware that some commands or functions might not work as intended because the data in the database is only partially available."})
        })
    )
})

//REGISTER MESSAGE BUILDERS
openticket.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-migrate-v3:migrate-message"))
    messages.get("ot-migrate-v3:migrate-message").workers.add(
        new api.ODWorker("ot-migrate-v3:migrate-message",0,async (instance,params,source,cancel) => {
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-migrate-v3:migrate-embed").build(source,{}))
            instance.addComponent(await openticket.builders.buttons.getSafe("ot-migrate-v3:migrate-button").build(source,{}))
        })
    )
    messages.add(new api.ODMessage("ot-migrate-v3:success-message"))
    messages.get("ot-migrate-v3:success-message").workers.add(
        new api.ODWorker("ot-migrate-v3:success-message",0,async (instance,params,source,cancel) => {
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-migrate-v3:success-embed").build(source,{}))

            //add disabled transfer button
            const migrateButton = await openticket.builders.buttons.getSafe("ot-migrate-v3:migrate-button").build(source,{})
            if (migrateButton.component && typeof migrateButton.component != "string") migrateButton.component.setDisabled(true)
            instance.addComponent(migrateButton)
        })
    )
})

//DETECT TICKETS
openticket.events.get("onReadyForUsage").listen(async () => {
    const client = openticket.client.client
    const mainServer = openticket.client.mainServer
    if (!mainServer) return openticket.log("Unable to detect v3 tickets because server couldn't be found!","error")

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
        await channel.send((await openticket.builders.messages.getSafe("ot-migrate-v3:migrate-message").build("other",{})).message)
        
        openticket.log("Found valid Open Ticket v3 channel! Sending migration embed...","plugin",[
            {key:"channel",value:"#"+channel.name},
            {key:"channelid",value:channel.id,hidden:true},
        ])
    })
})

//RESPOND TO MIGRATION
openticket.events.get("onButtonResponderLoad").listen((buttons) => {
    buttons.add(new api.ODButtonResponder("ot-migrate-v3:migrate-button",/^od:migrate-v3-migrate$/))
    buttons.get("ot-migrate-v3:migrate-button").workers.add(
        new api.ODWorker("ot-migrate-v3:migrate-button",0,async (instance,params,source,cancel) => {
            const {user,channel,guild,message} = instance
            const optionDatabase = openticket.databases.get("openticket:options")
            const client = openticket.client.client

            //check for guild & permissions
            if (!openticket.permissions.hasPermissions("admin",await openticket.permissions.getPermissions(user,channel,guild))){
                //no permissions
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-no-permissions").build("button",{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin"]}))
                return cancel()
            }
            if (channel.isDMBased() || channel.type != discord.ChannelType.GuildText || !guild){
                //not in server
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-ticket-unknown").build("button",{guild,channel,user}))
                return cancel()
            }

            await instance.defer("update",false)

            openticket.log("Starting ticket migration!","plugin",[
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
                instance.reply(await openticket.builders.messages.getSafe("openticket:error").build("button",{guild,channel,user,layout:"simple",error:"This channel isn't a valid OTv3 ticket!"}))
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
            const globalAdmins = openticket.configs.get("openticket:general").data.globalAdmins
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
                new api.ODOptionData("openticket:name",initialEmbedName),
                new api.ODOptionData("openticket:description","This option is made for the transfer of this ticket from v3 to v4."),

                new api.ODOptionData("openticket:button-emoji","❌"),
                new api.ODOptionData("openticket:button-label","Temporary"),
                new api.ODOptionData("openticket:button-color","gray"),
                
                new api.ODOptionData("openticket:admins",[]),
                new api.ODOptionData("openticket:admins-readonly",[]),
                new api.ODOptionData("openticket:allow-blacklisted-users",false),
                new api.ODOptionData("openticket:questions",[]),

                new api.ODOptionData("openticket:channel-prefix",channelPrefix),
                new api.ODOptionData("openticket:channel-suffix","user-name"),
                new api.ODOptionData("openticket:channel-category",channelCategory),
                new api.ODOptionData("openticket:channel-category-closed",""),
                new api.ODOptionData("openticket:channel-category-backup",""),
                new api.ODOptionData("openticket:channel-categories-claimed",[]),
                new api.ODOptionData("openticket:channel-description",""),
                
                new api.ODOptionData("openticket:dm-message-enabled",false),
                new api.ODOptionData("openticket:dm-message-text",""),
                new api.ODOptionData("openticket:dm-message-embed",{}),

                new api.ODOptionData("openticket:ticket-message-enabled",true),
                new api.ODOptionData("openticket:ticket-message-text",""),
                new api.ODOptionData("openticket:ticket-message-embed",{
                    enabled:true,
                    title:initialEmbedName,
                    description:initialEmbedDescription,
                    customColor:"",
    
                    image:initialEmbedImage,
                    thumbnail:initialEmbedThumbnail,
                    fields:initialEmbedFields,
                    timestamp:false
                }),
                new api.ODOptionData("openticket:ticket-message-ping",{
                    "@here":true,
                    "@everyone":false,
                    custom:[]
                }),

                new api.ODOptionData("openticket:autoclose-enable-hours",false),
                new api.ODOptionData("openticket:autoclose-enable-leave",false),
                new api.ODOptionData("openticket:autoclose-disable-claim",false),
                new api.ODOptionData("openticket:autoclose-hours",0),

                new api.ODOptionData("openticket:autodelete-enable-days",false),
                new api.ODOptionData("openticket:autodelete-enable-leave",false),
                new api.ODOptionData("openticket:autodelete-disable-claim",false),
                new api.ODOptionData("openticket:autodelete-days",0),

                new api.ODOptionData("openticket:cooldown-enabled",false),
                new api.ODOptionData("openticket:cooldown-minutes",0),

                new api.ODOptionData("openticket:limits-enabled",false),
                new api.ODOptionData("openticket:limits-maximum-global",0),
                new api.ODOptionData("openticket:limits-maximum-user",0)
            ])
            openticket.options.add(option)
        
            //create ticket
            const ticket = new api.ODTicket(channel.id,option,[
                new api.ODTicketData("openticket:busy",false),
                new api.ODTicketData("openticket:ticket-message",null),
                new api.ODTicketData("openticket:participants",participants),
                new api.ODTicketData("openticket:channel-suffix",channelSuffix),
                
                new api.ODTicketData("openticket:open",true),
                new api.ODTicketData("openticket:opened-by",null),
                new api.ODTicketData("openticket:opened-on",channel.createdAt.getTime()),
                new api.ODTicketData("openticket:closed",false),
                new api.ODTicketData("openticket:closed-by",null),
                new api.ODTicketData("openticket:closed-on",null),
                new api.ODTicketData("openticket:claimed",false),
                new api.ODTicketData("openticket:claimed-by",null),
                new api.ODTicketData("openticket:claimed-on",null),
                new api.ODTicketData("openticket:pinned",false),
                new api.ODTicketData("openticket:pinned-by",null),
                new api.ODTicketData("openticket:pinned-on",null),
                new api.ODTicketData("openticket:for-deletion",false),
    
                new api.ODTicketData("openticket:category",channelCategory),
                new api.ODTicketData("openticket:category-mode",categoryMode),
    
                new api.ODTicketData("openticket:autoclose-enabled",option.get("openticket:autoclose-enable-hours").value),
                new api.ODTicketData("openticket:autoclose-hours",(option.get("openticket:autoclose-enable-hours").value ? option.get("openticket:autoclose-hours").value : 0)),
                new api.ODTicketData("openticket:autoclosed",false),
                new api.ODTicketData("openticket:autodelete-enabled",option.get("openticket:autodelete-enable-days").value),
                new api.ODTicketData("openticket:autodelete-days",(option.get("openticket:autodelete-enable-days").value ? option.get("openticket:autodelete-days").value : 0)),
    
                new api.ODTicketData("openticket:answers",[])
            ])
            openticket.tickets.add(ticket)
    
            //manage stats
            await openticket.stats.get("openticket:global").setStat("openticket:tickets-created",1,"increase")
            await openticket.stats.get("openticket:user").setStat("openticket:tickets-created",user.id,1,"increase")

            //edit ticket-message
            await ticketMessage.edit((await openticket.builders.messages.getSafe("openticket:ticket-message").build("other",{guild,channel,user,ticket})).message)
            ticket.get("openticket:ticket-message").value = ticketMessage.id

            await instance.update(await openticket.builders.messages.getSafe("ot-migrate-v3:success-message").build("other",{}))

            openticket.log("Ticket migrated to v4 successfully!","plugin",[
                {key:"channel",value:"#"+channel.name},
                {key:"channelid",value:channel.id,hidden:true},
            ])
        })
    )
})