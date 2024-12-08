import {api, openticket, utilities} from "../../src/index"
import * as discord from "discord.js"
import ansis from "ansis"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
export interface OTCustomEmbedsEmbed {
    id:string,
    content:string,
    title:string,
    description:string,
    customColor:discord.ColorResolvable,

    image:string,
    thumbnail:string,
    authorText:string,
    authorImage:string,
    footerText:string,
    footerImage:string,

    timestamp:boolean,
    fields:{name:string,value:string,inline:boolean}[],
    ping:{
        "@here":boolean,
        "@everyone":boolean,
        custom:string[]
    }
}

export class OTCustomEmbedsConfig extends api.ODJsonConfig {
    declare data: OTCustomEmbedsEmbed[]
}

export class OTCustomEmbed extends api.ODManagerData {
    data: OTCustomEmbedsEmbed

    constructor(id:api.ODValidId, data:OTCustomEmbedsEmbed){
        super(id)
        this.data = data
    }
}
export class OTCustomEmbedManager extends api.ODManager<OTCustomEmbed> {
    id: api.ODId = new api.ODId("ot-embeds:manager")
    defaults: {customEmbedsLoading:boolean} = {customEmbedsLoading:true}

    constructor(debug:api.ODDebugger){
        super(debug,"custom embed")
    }
}

declare module "../../src/core/api/api.js" {
    export interface ODConfigManagerIds_Default {
        "ot-embeds:config":OTCustomEmbedsConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-embeds:config":api.ODChecker
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-embeds:embed":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-embeds:embed":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-embeds:embed":{source:"slash"|"text",params:{},workers:"ot-embeds:embed"|"ot-embeds:logs"},
    }
    export interface ODMessageManagerIds_Default {
        "ot-embeds:embed-message":{source:"slash"|"other",params:{embed:OTCustomEmbedsEmbed},workers:"ot-embeds:embed-message"},
        "ot-embeds:success-message":{source:"slash"|"other",params:{},workers:"ot-embeds:success-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-embeds:embed-embed":{source:"slash"|"other",params:{embed:OTCustomEmbedsEmbed},workers:"ot-embeds:embed-embed"},
    }
    export interface ODEventIds_Default {
        "ot-embeds:onEmbedLoad":api.ODEvent_Default<(embeds:OTCustomEmbedManager) => api.ODPromiseVoid>
        "ot-embeds:afterEmbedsLoaded":api.ODEvent_Default<(embeds:OTCustomEmbedManager) => api.ODPromiseVoid>
    }
    export interface ODPluginClassManagerIds_Default {
        "ot-embeds:manager":OTCustomEmbedManager
    }
}

//REGISTER PLUGIN CLASS
openticket.events.get("onPluginClassLoad").listen((classes) => {
    classes.add(new OTCustomEmbedManager(openticket.debug))
})

//REGISTER CONFIG FILE
openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTCustomEmbedsConfig("ot-embeds:config","config.json","./plugins/ot-embeds/"))
})

//CONFIG STRUCTURE
export const embedsConfigStructure = new api.ODCheckerArrayStructure("ot-embeds:config",{maxLength:25,allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-embeds:config",{children:[
    //TODO id
    {key:"id",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UniqueId("ot-embeds:id","ot-embeds","embed-ids",{regex:/^[A-Za-z0-9-éèçàêâôûî]+$/,minLength:3,maxLength:40})},
    {key:"content",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-embeds:content",{maxLength:2000})},
    {key:"title",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-embeds:title",{minLength:1,maxLength:256})},
    {key:"description",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-embeds:description",{maxLength:4096})},
    {key:"customColor",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_HexColor("ot-embeds:custom-color",true,true)},

    {key:"image",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-embeds:image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
    {key:"thumbnail",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-embeds:thumbnail",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
    {key:"authorText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-embeds:author-text",{maxLength:256})},
    {key:"authorImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-embeds:author-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
    {key:"footerText",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-embeds:footer-text",{maxLength:2048})},
    {key:"footerImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-embeds:footer-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
    
    {key:"timestamp",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-embeds:timestamp",{})},
    {key:"fields",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-embeds:fields",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-embeds:field",{children:[
        {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-embeds:field-name",{minLength:1,maxLength:256})},
        {key:"value",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-embeds:field-value",{minLength:1,maxLength:1024})},
        {key:"inline",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-embeds:field-inline",{})}
    ]})})},

    {key:"ping",optional:false,priority:0,checker:new api.ODCheckerObjectStructure("ot-embeds:ping",{children:[
        {key:"@here",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-embeds:ping-here",{})},
        {key:"@everyone",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-embeds:ping-everyone",{})},
        {key:"custom",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_DiscordIdArray("ot-embeds:ping-custom","role",[],{allowDoubles:false})},
    ]})}
]})})

//REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-embeds:config")
    checkers.add(new api.ODChecker("ot-embeds:config",checkers.storage,0,config,embedsConfigStructure))
})

//REGISTER SLASH COMMAND
const act = discord.ApplicationCommandType
const acot = discord.ApplicationCommandOptionType
openticket.events.get("onSlashCommandLoad").listen((slash) => {
    const config = openticket.configs.get("ot-embeds:config")

    //create embed choices
    const embedChoices : {name:string, value:string}[] = []
    config.data.forEach((embed) => {
        embedChoices.push({name:embed.title,value:embed.id})
    })

    slash.add(new api.ODSlashCommand("ot-embeds:embed",{
        name:"embed",
        description:"Send a custom embed or choose a pre-configured message.",
        type:act.ChatInput,
        options:[
            {
                type:acot.Subcommand,
                name:"custom",
                description:"Create a custom embed from scratch. This method isn't as advanced as the pre-configured messages.",
                options:[
                    {
                        type:acot.Channel,
                        name:"channel",
                        description:"The channel to send the embed.",
                        required:true,
                        channelTypes:[discord.ChannelType.GuildText,discord.ChannelType.GuildAnnouncement]
                    },
                    {
                        type:acot.String,
                        name:"color",
                        description:"The embed color!",
                        required:true,
                        choices:[
                            {name:"White", value:"White"},
                            {name:"Aqua", value:"Aqua"},
                            {name:"Green", value:"Green"},
                            {name:"Blue", value:"Blue"},
                            {name:"Yellow", value:"Yellow"},
                            {name:"Purple", value:"Purple"},
                            {name:"Orange", value:"Orange"},
                            {name:"Red", value:"Red"},
                            {name:"Grey", value:"Grey"},
                            {name:"Navy", value:"Navy"},
                            {name:"Blurple", value:"Blurple"},
                            {name:"Black", value:"#000000"},
                            {name:"Bot Color", value:"%CONFIG_COLOR%"}
                        ]
                    },
                    {
                        type:acot.String,
                        name:"title",
                        description:"The embed title.",
                        required:false,
                        maxLength:256
                    },
                    {
                        type:acot.String,
                        name:"description",
                        description:"The embed description.",
                        required:false,
                        maxLength:4096
                    },
                    {
                        type:acot.String,
                        name:"footer",
                        description:"The embed footer.",
                        required:false,
                        maxLength:2048
                    },
                    {
                        type:acot.String,
                        name:"author",
                        description:"The embed author.",
                        required:false,
                        maxLength:256
                    },
                    {
                        type:acot.Boolean,
                        name:"timestamp",
                        description:"Add an embed timestamp.",
                        required:false
                    },
                    {
                        type:acot.String,
                        name:"image",
                        description:"The embed image.",
                        required:false
                    },
                    {
                        type:acot.String,
                        name:"thumbnail",
                        description:"The embed thumbnail.",
                        required:false
                    },
                    {
                        type:acot.Mentionable,
                        name:"ping",
                        description:"The user/role you want to ping.",
                        required:false
                    }
                ]
            },
            {
                type:acot.Subcommand,
                name:"preset",
                description:"Spawn a pre-configured embed from the config.",
                options:[
                    {
                        type:acot.Channel,
                        name:"channel",
                        description:"The channel to send the embed.",
                        required:true,
                        channelTypes:[discord.ChannelType.GuildText,discord.ChannelType.GuildAnnouncement]
                    },
                    {
                        name:"id",
                        description:"The id of the embed to send.",
                        type:acot.String,
                        required:true,
                        choices:embedChoices
                    }
                ]
            }
        ]
    },(current) => {
        //check if this slash command needs to be updated
        if (!current.options) return true

        const presetSubcommand = current.options.find((opt) => opt.name == "preset") as discord.ApplicationCommandSubCommandData|undefined
        if (!presetSubcommand || !presetSubcommand.options) return true

        const idOption = presetSubcommand.options.find((opt) => opt.name == "id" && opt.type == acot.String) as discord.ApplicationCommandStringOptionData|undefined
        if (!idOption || !idOption.choices || idOption.choices.length != embedChoices.length) return true
        else if (!embedChoices.every((embed) => {
            if (!idOption.choices) return false
            else if (!idOption.choices.find((choice) => choice.value == embed.value && choice.name == embed.name)) return false
            else return true
        })) return true
        else return false
    }))
})

//REGISTER HELP MENU
openticket.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("openticket:extra").add(new api.ODHelpMenuCommandComponent("ot-embeds:embed",0,{
        slashName:"embed",
        slashDescription:"Create a custom embed in the server.",
    }))
})

//LOAD EMBEDS
openticket.events.get("afterBlacklistLoaded").listen(async () => {
    const embedManager = openticket.plugins.classes.get("ot-embeds:manager")
    const config = openticket.configs.get("ot-embeds:config")

    openticket.log("Loading custom embeds...","plugin")
    if (embedManager.defaults.customEmbedsLoading){
        config.data.forEach((embed) => {
            embedManager.add(new OTCustomEmbed(embed.id,embed))
        })
    }
    await openticket.events.get("ot-embeds:onEmbedLoad").emit([embedManager])
    await openticket.events.get("ot-embeds:afterEmbedsLoaded").emit([embedManager])
})

//REGISTER EMBED BUILDER
openticket.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("ot-embeds:embed-embed"))
    embeds.get("ot-embeds:embed-embed").workers.add(
        new api.ODWorker("ot-embeds:embed-embed",0,(instance,params,source,cancel) => {
            const generalConfig = openticket.configs.get("openticket:general")
            const {embed} = params

            instance.setTitle(embed.title)
            instance.setColor((embed.customColor) ? embed.customColor : generalConfig.data.mainColor)
            if (embed.description) instance.setDescription(embed.description)

            if (embed.image) instance.setImage(embed.image)
            if (embed.thumbnail) instance.setThumbnail(embed.thumbnail)
            if (embed.footerText) instance.setFooter(embed.footerText,(embed.footerImage) ? embed.footerImage : null)
            if (embed.authorText) instance.setAuthor(embed.authorText,(embed.authorImage) ? embed.authorImage : null)
                
            if (embed.timestamp) instance.setTimestamp(new Date())
            if (embed.fields.length > 0) instance.setFields(embed.fields)
        })
    )
})

//REGISTER MESSAGE BUILDER
openticket.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-embeds:embed-message"))
    messages.get("ot-embeds:embed-message").workers.add(
        new api.ODWorker("ot-embeds:embed-message",0,async (instance,params,source,cancel) => {
            const {embed} = params
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-embeds:embed-embed").build(source,{embed}))

            //create pings
            const pings: string[] = []
            if (embed.ping["@everyone"]) pings.push("@everyone")
            if (embed.ping["@here"]) pings.push("@here")
            embed.ping.custom.forEach((ping) => pings.push(discord.roleMention(ping)))
            const pingText = (pings.length > 0) ? pings.join(" ")+"\n" : ""
    
            //create content
            if (embed.content !== "") instance.setContent(pingText+embed.content)
            else if (pings.length > 0) instance.setContent(pingText)
        })
    )

    messages.add(new api.ODMessage("ot-embeds:success-message"))
    messages.get("ot-embeds:success-message").workers.add(
        new api.ODWorker("ot-embeds:success-message",0,async (instance,params,source,cancel) => {
            instance.setContent("✅ The embed has been created succesfully!")
            instance.setEphemeral(true)
        })
    )
})

//REGISTER COMMAND RESPONDER
openticket.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = openticket.configs.get("openticket:general")
    const embedManager = openticket.plugins.classes.get("ot-embeds:manager")

    commands.add(new api.ODCommandResponder("ot-embeds:embed",generalConfig.data.prefix,"embed"))
    commands.get("ot-embeds:embed").workers.add([
        new api.ODWorker("ot-embeds:embed",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            if (!guild){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-not-in-guild").build("button",{channel,user}))
                return cancel()
            }

            if (!openticket.permissions.hasPermissions("admin",await openticket.permissions.getPermissions(instance.user,instance.channel,instance.guild))){
                //no permissions
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin"]}))
                return cancel()
            }

            //command doesn't support text-commands!
            if (source == "text") return cancel()
            const scope = instance.options.getSubCommand() as "custom"|"preset"

            if (scope == "custom"){
                const embedChannel = instance.options.getChannel("channel",true) as discord.GuildTextBasedChannel
                const customColor = (instance.options.getString("color",true) as `#${string}`).replace("%CONFIG_COLOR%",generalConfig.data.mainColor.toString()) as `#${string}`
                const title = instance.options.getString("title",false) ?? ""
                const description = instance.options.getString("description",false) ?? ""
                const footerText = instance.options.getString("footer",false) ?? ""
                const authorText = instance.options.getString("author",false) ?? ""
                const timestamp = instance.options.getBoolean("timestamp",false) ?? false
                const image = instance.options.getString("image",false) ?? ""
                const thumbnail = instance.options.getString("thumbnail",false) ?? ""
                const ping = instance.options.getMentionable("ping",false)
                const pingCustom = ping ? [ping.id] : []

                await embedChannel.send((await openticket.builders.messages.getSafe("ot-embeds:embed-message").build(source,{embed:{
                    id:"_CUSTOM_",
                    content:"",
                    title,
                    description,
                    customColor,

                    image,
                    thumbnail,
                    authorText,
                    authorImage:"",
                    footerText,
                    footerImage:"",

                    timestamp,
                    fields:[],
                    ping:{
                        "@here":false,
                        "@everyone":false,
                        custom:pingCustom
                    }
                }})).message)

            }else if (scope == "preset"){
                const embedChannel = instance.options.getChannel("channel",true) as discord.GuildTextBasedChannel
                const embedId = instance.options.getString("id",true)
                
                const embed = embedManager.get(embedId)
                if (!embed){
                    instance.reply(await openticket.builders.messages.getSafe("openticket:error").build(source,{guild,channel,user,layout:"simple",error:"Invalid embed id. Please try again!"}))
                    return cancel()
                }

                await embedChannel.send((await openticket.builders.messages.getSafe("ot-embeds:embed-message").build(source,{embed:{
                    id:embed.id.value,
                    content:embed.data.content,
                    title:embed.data.title,
                    description:embed.data.description,
                    customColor:embed.data.customColor,

                    image:embed.data.image,
                    thumbnail:embed.data.thumbnail,
                    authorText:embed.data.authorText,
                    authorImage:embed.data.authorImage,
                    footerText:embed.data.footerText,
                    footerImage:embed.data.footerImage,

                    timestamp:embed.data.timestamp,
                    fields:embed.data.fields,
                    ping:embed.data.ping
                }})).message)
            }

            //reply
            await instance.reply(await openticket.builders.messages.getSafe("ot-embeds:success-message").build(source,{}))
        }),
        new api.ODWorker("ot-embeds:logs",-1,(instance,params,source,cancel) => {
            const scope = instance.options.getSubCommand() as "custom"|"preset"
            openticket.log(instance.user.displayName+" used the 'embed "+scope+"' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source}
            ])
        })
    ])
})

//STARTUP SCREEN
openticket.events.get("onStartScreenLoad").listen((startscreen) => {
    const embedManager = openticket.plugins.classes.get("ot-embeds:manager")
    const stats = startscreen.get("openticket:stats")
    if (!stats) return

    //insert embeds startup info before "help" stat.
    const newProperties = [
        ...stats.properties.slice(0,5),
        {key:"embeds",value:"loaded "+ansis.bold(embedManager.getLength().toString())+" embeds!"},
        ...stats.properties.slice(5)
    ]
    stats.properties = newProperties
})