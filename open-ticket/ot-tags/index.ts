import { api, openticket, utilities } from "#opendiscord"
import * as discord from "discord.js"
import crypto from "crypto"
import ansis from "ansis"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

function randomHexId(blacklist:string[]){
    const hash = crypto.randomBytes(8).toString("hex")
    if (blacklist.includes(hash)) return randomHexId(blacklist)
    else return hash
}

//DECLARATION
class OTTagsConfig extends api.ODJsonConfig {
    declare data: {
        layout:"text"|"bold-text"|"embed",
        mentionUser:boolean,
        autoTagCooldownSeconds:number,
        embedLayout:{
            title:boolean,
            customColor:discord.ColorResolvable,
            url:string,
            thumbnail:string,
            footer:string,
            timestamp:boolean
        },
        enableSmartAutoTag:boolean
    }
}
export interface OTTagJson {
    id:string,
    version:string,
    data:{
        name:string,
        value:string,
        adminOnly:boolean,
        auto:boolean,
        keywords:string[]
    }
}
export class OTTag extends api.ODManagerData {
    #name: string
    set name(value:string){
        this.#name = value
        this._change()
    }
    get name(){
        return this.#name
    }

    #value: string
    set value(value:string){
        this.#value = value
        this._change()
    }
    get value(){
        return this.#value
    }

    #adminOnly: boolean
    set adminOnly(value:boolean){
        this.#adminOnly = value
        this._change()
    }
    get adminOnly(){
        return this.#adminOnly
    }

    #auto: boolean
    set auto(value:boolean){
        this.#auto = value
        this._change()
    }
    get auto(){
        return this.#auto
    }

    #keywords: string[]
    set keywords(value:string[]){
        this.#keywords = value
        this._change()
    }
    get keywords(){
        return this.#keywords
    }

    constructor(id:api.ODValidId,name:string,value:string,adminOnly:boolean,auto:boolean,keywords:string[]){
        super(id)
        this.#name = name
        this.#value = value
        this.#adminOnly = adminOnly
        this.#auto = auto
        this.#keywords = keywords
    }

    matchKeywords(text:string,smartMode:boolean){
        if (!this.#auto) return false
        if (smartMode){
            //smart mode
            let score = 0
            this.#keywords.forEach((k) => {
                if (text.includes(k)) score = score + 1.5
            })
            const words = text.split(" ")
            words.forEach((w) => {
                if (this.#keywords.includes(w)) score = score + 0.8
            })
            
            let secondScore = this.#keywords.length * 0.7
            return (score > secondScore)

        }else{
            //default mode
            return this.keywords.every((k) => text.includes(k))
        }
    }

    toJson(pluginVersion:api.ODVersion): OTTagJson {
        return {
            id:this.id.value,
            version:pluginVersion.toString(),
            data:{
                name:this.#name,
                value:this.#value,
                adminOnly:this.#adminOnly,
                auto:this.#auto,
                keywords:this.#keywords
            }
        }
    }
    static fromJson(json:OTTagJson): OTTag {
        const {name,value,adminOnly,auto,keywords} = json.data
        return new OTTag(json.id,name,value,adminOnly,auto,keywords)
    }
}
export class OTTagManager extends api.ODManager<OTTag> {
    id: api.ODId = new api.ODId("ot-tags:manager")
    defaults: {tagLoading:boolean} = {tagLoading:true}

    constructor(debug:api.ODDebugger){
        super(debug,"tag")
    }
}
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-tags":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-tags:config": OTTagsConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-tags:config": api.ODChecker
    }
    export interface ODDatabaseManagerIds_Default {
        "ot-tags:tags": api.ODJsonDatabase
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-tags:tag":api.ODSlashCommand,
        "ot-tags:tags":api.ODSlashCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-tags:tag":{source:"slash"|"text",params:{},workers:"ot-tags:tag"|"ot-tags:logs"},
        "ot-tags:tags":{source:"slash"|"text",params:{},workers:"ot-tags:tags"|"ot-tags:logs"},
    }
    export interface ODEventIds_Default {
        "ot-tags:onTagCreated":api.ODEvent_Default<(tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel) => api.ODPromiseVoid>,
        "ot-tags:onTagRemoved":api.ODEvent_Default<(tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel) => api.ODPromiseVoid>,
        "ot-tags:onTagEdited":api.ODEvent_Default<(tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel) => api.ODPromiseVoid>,
        "ot-tags:onTagUsed":api.ODEvent_Default<(tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel) => api.ODPromiseVoid>,
        "ot-tags:onAutoTagTriggered":api.ODEvent_Default<(tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel) => api.ODPromiseVoid>
    }
    export interface ODMessageManagerIds_Default {
        "ot-tags:tag-message":{source:"slash"|"text"|"keyword"|"other",params:{tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel,keyword:string|null},workers:"ot-tags:tag-message"},
        "ot-tags:tag-created-message":{source:"slash"|"text"|"other",params:{tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel},workers:"ot-tags:tag-created-message"},
        "ot-tags:tag-edited-message":{source:"slash"|"text"|"other",params:{tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel},workers:"ot-tags:tag-edited-message"},
        "ot-tags:tag-removed-message":{source:"slash"|"text"|"other",params:{tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel},workers:"ot-tags:tag-removed-message"},
        "ot-tags:log-message":{source:"slash"|"text"|"other",params:{action:"create"|"edit"|"remove",tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel},workers:"ot-tags:log-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-tags:tag-embed":{source:"slash"|"text"|"keyword"|"other",params:{tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel,keyword:string|null},workers:"ot-tags:tag-embed"},
        "ot-tags:tag-created-embed":{source:"slash"|"text"|"other",params:{tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel},workers:"ot-tags:tag-created-embed"},
        "ot-tags:tag-edited-embed":{source:"slash"|"text"|"other",params:{tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel},workers:"ot-tags:tag-edited-embed"},
        "ot-tags:tag-removed-embed":{source:"slash"|"text"|"other",params:{tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel},workers:"ot-tags:tag-removed-embed"},
        "ot-tags:log-embed":{source:"slash"|"text"|"other",params:{action:"create"|"edit"|"remove",tag:OTTag,user:discord.User,channel:discord.GuildTextBasedChannel},workers:"ot-tags:log-embed"},
    }
    export interface ODPluginClassManagerIds_Default {
        "ot-tags:manager":OTTagManager
    }
    export interface ODCodeManagerIds_Default {
        "ot-tags:tag-saver":api.ODCode,
        "ot-tags:tag-loader":api.ODCode,
    }
    export interface ODStatGlobalScopeIds_DefaultGlobal {
        "ot-tags:tags-created":api.ODBasicStat
    }
}

//REGISTER MANAGER
openticket.events.get("onPluginClassLoad").listen((classes) => {
    classes.add(new OTTagManager(openticket.debug))
})

//REGISTER CONFIG
openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTTagsConfig("ot-tags:config","config.json","./plugins/ot-tags/"))
})

//REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-tags:config")
    checkers.add(new api.ODChecker("ot-tags:config",checkers.storage,0,config,new api.ODCheckerObjectStructure("ot-tags:config",{children:[
        {key:"layout",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-tags:layout",{choices:["text","bold-text","embed"]})},
        {key:"mentionUser",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-tags:smart-mention",{})},
        {key:"autoTagCooldownSeconds",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-tags:smart-cooldown",{floatAllowed:false,negativeAllowed:false,min:1,max:3600})},
        {key:"embedLayout",optional:false,priority:0,checker:new api.ODCheckerObjectStructure("ot-tags:embed-layout",{children:[
            {key:"title",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-tags:embed-title",{})},
            {key:"customColor",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_HexColor("ot-tags:embed-color",true,true)},
            {key:"url",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-tags:embed-url",true,{allowHttp:false})},
            {key:"thumbnail",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-tags:embed-thumbnail",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
            {key:"footer",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-tags:embed-footer",{maxLength:2048})},
            {key:"timestamp",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-tags:embed-timestamp",{})}
        ]})},
        {key:"enableSmartAutoTag",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-tags:smart-enabled",{})}
    ]})))
})

//REGISTER TAGS DATABASE
openticket.events.get("onDatabaseLoad").listen((databases) => {
    const devdatabaseFlag = openticket.flags.get("openticket:dev-database")
    const isDevdatabase = devdatabaseFlag ? devdatabaseFlag.value : false

    databases.add(new api.ODJsonDatabase("ot-tags:tags","tags.json",(isDevdatabase) ? "./devdatabase/" : "./database/"))
})

//REGISTER SLASH COMMANDS
openticket.events.get("onSlashCommandLoad").listen((slash) => {
    slash.add(new api.ODSlashCommand("ot-tags:tag",{
        name:"tag",
        description:"Use a tag in this channel.",
        type:discord.ApplicationCommandType.ChatInput,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall],
        options:[
            {
                type:discord.ApplicationCommandOptionType.String,
                name:"name",
                description:"The name of the tag you want to use.",
                required:true,
                autocomplete:true
            }
        ]
    }))
    slash.add(new api.ODSlashCommand("ot-tags:tags",{
        name:"tags",
        description:"Manage all tags in the server.",
        type:discord.ApplicationCommandType.ChatInput,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall],
        options:[
            {
                type:discord.ApplicationCommandOptionType.Subcommand,
                name:"add",
                description:"Add a new tag to the bot.",
                options:[
                    {
                        type:discord.ApplicationCommandOptionType.String,
                        name:"name",
                        description:"The name of the tag you want to add. (must be unique)",
                        required:true
                    },
                    {
                        type:discord.ApplicationCommandOptionType.String,
                        name:"contents",
                        description:"The contents of the tag.",
                        required:true
                    },
                    {
                        type:discord.ApplicationCommandOptionType.Boolean,
                        name:"admin-only",
                        description:"When enabled, only admins are able to use this tag.",
                        required:false
                    },
                    {
                        type:discord.ApplicationCommandOptionType.Boolean,
                        name:"auto",
                        description:"When enabled, the bot will auto respond based on the defined keywords.",
                        required:false
                    },
                    {
                        type:discord.ApplicationCommandOptionType.String,
                        name:"keywords",
                        description:"Keywords seperated by a comma to use when 'auto' mode is enabled.",
                        required:false
                    }
                ]
            },
            {
                type:discord.ApplicationCommandOptionType.Subcommand,
                name:"edit",
                description:"Edit an existing tag in the bot.",
                options:[
                    {
                        type:discord.ApplicationCommandOptionType.String,
                        name:"name",
                        description:"The name of the tag you want to edit.",
                        required:true,
                        autocomplete:true
                    },
                    {
                        type:discord.ApplicationCommandOptionType.String,
                        name:"contents",
                        description:"The contents of the tag.",
                        required:true
                    },
                    {
                        type:discord.ApplicationCommandOptionType.Boolean,
                        name:"admin-only",
                        description:"When enabled, only admins are able to use this tag.",
                        required:false
                    },
                    {
                        type:discord.ApplicationCommandOptionType.Boolean,
                        name:"auto",
                        description:"When enabled, the bot will auto respond based on the defined keywords.",
                        required:false
                    },
                    {
                        type:discord.ApplicationCommandOptionType.String,
                        name:"keywords",
                        description:"Keywords seperated by a comma to use when 'auto' mode is enabled.",
                        required:false
                    }
                ]
            },
            {
                type:discord.ApplicationCommandOptionType.Subcommand,
                name:"remove",
                description:"Remove an existing tag from the bot.",
                options:[
                    {
                        type:discord.ApplicationCommandOptionType.String,
                        name:"name",
                        description:"The name of the tag you want to remove.",
                        required:true,
                        autocomplete:true
                    }
                ]
            }
        ]
    }))
})

//REGISTER HELP MENU
openticket.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("openticket:extra").add(new api.ODHelpMenuCommandComponent("ot-tags:tag",0,{
        slashName:"tag",
        slashDescription:"Use a tag in a channel!",
    }))
    menu.get("openticket:extra").add(new api.ODHelpMenuCommandComponent("ot-tags:tags",0,{
        slashName:"tags",
        slashDescription:"Manage all tags in the server!",
    }))
})

//REGISTER EMBED BUILDERS
openticket.events.get("onEmbedBuilderLoad").listen((embeds) => {
    const generalConfig = openticket.configs.get("openticket:general")
    const config = openticket.configs.get("ot-tags:config")

    embeds.add(new api.ODEmbed("ot-tags:tag-embed"))
    embeds.get("ot-tags:tag-embed").workers.add(
        new api.ODWorker("ot-tags:tag-embed",0,(instance,params,source,cancel) => {
            const {tag,user,channel,keyword} = params
            const keywordSuffix = ((config.data.layout == "text" || config.data.layout == "bold-text") && keyword) ? "\n\n*Triggered By:* `"+keyword+"`" : ""

            instance.setColor(config.data.embedLayout.customColor ? config.data.embedLayout.customColor : generalConfig.data.mainColor)
            instance.setDescription(tag.value+keywordSuffix)
            instance.setAuthor(user.displayName,user.displayAvatarURL())
            if (config.data.embedLayout.title) instance.setTitle(utilities.emojiTitle("🏷️",tag.name))
            if (config.data.embedLayout.footer) instance.setFooter(config.data.embedLayout.footer)
            if (config.data.embedLayout.url) instance.setUrl(config.data.embedLayout.url)
            if (config.data.embedLayout.thumbnail) instance.setThumbnail(config.data.embedLayout.thumbnail)
            if (config.data.embedLayout.timestamp) instance.setTimestamp(new Date())
        })
    )

    embeds.add(new api.ODEmbed("ot-tags:tag-created-embed"))
    embeds.get("ot-tags:tag-created-embed").workers.add(
        new api.ODWorker("ot-tags:tag-created-embed",0,(instance,params,source,cancel) => {
            const {tag,user} = params

            instance.setAuthor(user.displayName,user.displayAvatarURL())
            instance.setTitle(utilities.emojiTitle("🏷️","Tag Created"))
            instance.setColor(config.data.embedLayout.customColor ? config.data.embedLayout.customColor : generalConfig.data.mainColor)
            instance.setDescription("A new tag has been created sucessfully!")
            instance.addFields({name:"Name:",value:"```"+tag.name+"```"})
            if (tag.adminOnly) instance.addFields({name:"Admin Only:",value:"```Yes```"})
            if (tag.keywords.length > 0 && tag.auto) instance.addFields({name:"Keywords:",value:"```"+tag.keywords.join(", ")+"```"})
        })
    )

    embeds.add(new api.ODEmbed("ot-tags:tag-edited-embed"))
    embeds.get("ot-tags:tag-edited-embed").workers.add(
        new api.ODWorker("ot-tags:tag-edited-embed",0,(instance,params,source,cancel) => {
            const {tag,user} = params
            
            instance.setAuthor(user.displayName,user.displayAvatarURL())
            instance.setTitle(utilities.emojiTitle("🏷️","Tag Edited"))
            instance.setColor(config.data.embedLayout.customColor ? config.data.embedLayout.customColor : generalConfig.data.mainColor)
            instance.setDescription("This tag has been edited sucessfully!")
            instance.addFields({name:"Name:",value:"```"+tag.name+"```"})
            if (tag.adminOnly) instance.addFields({name:"Admin Only:",value:"```Yes```"})
            if (tag.keywords.length > 0 && tag.auto) instance.addFields({name:"Keywords:",value:"```"+tag.keywords.join(", ")+"```"})
        })
    )

    embeds.add(new api.ODEmbed("ot-tags:tag-removed-embed"))
    embeds.get("ot-tags:tag-removed-embed").workers.add(
        new api.ODWorker("ot-tags:tag-removed-embed",0,(instance,params,source,cancel) => {
            const {tag,user} = params
            
            instance.setAuthor(user.displayName,user.displayAvatarURL())
            instance.setTitle(utilities.emojiTitle("🏷️","Tag Removed"))
            instance.setColor(config.data.embedLayout.customColor ? config.data.embedLayout.customColor : generalConfig.data.mainColor)
            instance.setDescription("This tag has been removed sucessfully!")
            instance.addFields({name:"Name:",value:"```"+tag.name+"```"})
        })
    )

    embeds.add(new api.ODEmbed("ot-tags:log-embed"))
    embeds.get("ot-tags:log-embed").workers.add(
        new api.ODWorker("ot-tags:log-embed",0,(instance,params,source,cancel) => {
            const {action,tag,user} = params
            const title = (action == "create") ? "Tag Created" : (action == "edit") ? "Tag Edited" : "Tag Removed"
            const description = (action == "create") ? "This tag has been created by "+discord.userMention(user.id)+"!" : (action == "edit") ? "This tag has been edited by "+discord.userMention(user.id)+"!" : "This tag has been removed by "+discord.userMention(user.id)+"!"

            instance.setColor(generalConfig.data.mainColor)
            instance.setTitle(utilities.emojiTitle("🏷️",title))
            instance.setThumbnail(user.displayAvatarURL())
            instance.setAuthor(user.displayName,user.displayAvatarURL())
            instance.setTimestamp(new Date())
            instance.setDescription(description)

            instance.addFields({name:"Name:",value:"```"+tag.name+"```"})
            if (tag.adminOnly) instance.addFields({name:"Admin Only:",value:"```Yes```"})
            if (tag.keywords.length > 0 && tag.auto) instance.addFields({name:"Keywords:",value:"```"+tag.keywords.join(", ")+"```"})
        })
    )
})

//REGISTER MESSAGE BUILDERS
openticket.events.get("onMessageBuilderLoad").listen((messages) => {
    const config = openticket.configs.get("ot-tags:config")

    messages.add(new api.ODMessage("ot-tags:tag-message"))
    messages.get("ot-tags:tag-message").workers.add(
        new api.ODWorker("ot-tags:tag-message",0,async (instance,params,source,cancel) => {
            const {tag,user,channel,keyword} = params
            const keywordSuffix = ((config.data.layout == "text" || config.data.layout == "bold-text") && keyword) ? "\n#- Triggered By: `"+keyword+"`" : ""

            if (config.data.layout == "text") instance.setContent(tag.value+keywordSuffix)
            else if (config.data.layout == "bold-text") instance.setContent("**"+tag.value+"**"+keywordSuffix)
            else if (config.data.layout == "embed") instance.addEmbed(await openticket.builders.embeds.getSafe("ot-tags:tag-embed").build(source,{tag,user,channel,keyword}))
        })
    )

    messages.add(new api.ODMessage("ot-tags:tag-created-message"))
    messages.get("ot-tags:tag-created-message").workers.add(
        new api.ODWorker("ot-tags:tag-created-message",0,async (instance,params,source,cancel) => {
            const {tag,user,channel} = params
            
            instance.setEphemeral(true)
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-tags:tag-created-embed").build(source,{tag,user,channel}))
        })
    )

    messages.add(new api.ODMessage("ot-tags:tag-edited-message"))
    messages.get("ot-tags:tag-edited-message").workers.add(
        new api.ODWorker("ot-tags:tag-edited-message",0,async (instance,params,source,cancel) => {
            const {tag,user,channel} = params
            
            instance.setEphemeral(true)
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-tags:tag-edited-embed").build(source,{tag,user,channel}))
        })
    )

    messages.add(new api.ODMessage("ot-tags:tag-removed-message"))
    messages.get("ot-tags:tag-removed-message").workers.add(
        new api.ODWorker("ot-tags:tag-removed-message",0,async (instance,params,source,cancel) => {
            const {tag,user,channel} = params
            
            instance.setEphemeral(true)
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-tags:tag-removed-embed").build(source,{tag,user,channel}))
        })
    )

    messages.add(new api.ODMessage("ot-tags:log-message"))
    messages.get("ot-tags:log-message").workers.add(
        new api.ODWorker("ot-tags:log-message",0,async (instance,params,source,cancel) => {
            const {action,tag,user,channel} = params
            
            instance.setEphemeral(true)
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-tags:log-embed").build(source,{action,tag,user,channel}))
        })
    )
})

openticket.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = openticket.configs.get("openticket:general")
    const tags = openticket.plugins.classes.get("ot-tags:manager")
    
    //TAG
    commands.add(new api.ODCommandResponder("ot-tags:tag",generalConfig.data.prefix,"tag"))
    commands.get("ot-tags:tag").workers.add([
        new api.ODWorker("ot-tags:tag",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            const nameOpt = instance.options.getString("name",true)

            //check if in guild
            if (!guild || channel.isDMBased()){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-not-in-guild").build(source,{channel,user}))
                return cancel()
            }

            const tag = tags.getAll().find((t) => t.name.toLowerCase() == nameOpt.toLowerCase())
            if (!tag){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error").build(source,{guild,channel,user,error:"Supplied an invalid tag name. Please try again!",layout:"simple"}))
                return cancel()
            }

            //check permissions (when admin only)
            if (tag.adminOnly && !openticket.permissions.hasPermissions("support",await openticket.permissions.getPermissions(user,channel,guild))){
                //no permissions
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin","support"]}))
                return cancel()
            }

            await openticket.events.get("ot-tags:onTagUsed").emit([tag,user,channel])
            await instance.reply(await openticket.builders.messages.getSafe("ot-tags:tag-message").build(source,{channel,user,keyword:null,tag}))
        }),
        new api.ODWorker("ot-tags:logs",-1,(instance,params,source,cancel) => {
            const nameOpt = instance.options.getString("name",true)
            const tag = tags.getAll().find((t) => t.name.toLowerCase() == nameOpt.toLowerCase())
            const tagName = tag ? tag.name : "/"

            openticket.log(instance.user.displayName+" used the 'tag' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source},
                {key:"tag",value:tagName},
            ])
        })
    ])

    //TAGS add,edit,remove
    commands.add(new api.ODCommandResponder("ot-tags:tags",generalConfig.data.prefix,"tags"))
    commands.get("ot-tags:tags").workers.add([
        new api.ODWorker("ot-tags:tags",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            const nameOpt = instance.options.getString("name",true)
            const modeOpt = instance.options.getSubCommand() as "add"|"edit"|"remove"

            //check if in guild
            if (!guild || channel.isDMBased()){
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-not-in-guild").build(source,{channel,user}))
                return cancel()
            }

            //check permissions
            if (!openticket.permissions.hasPermissions("support",await openticket.permissions.getPermissions(user,channel,guild))){
                //no permissions
                instance.reply(await openticket.builders.messages.getSafe("openticket:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin","support"]}))
                return cancel()
            }

            if (modeOpt == "add"){
                //create a new tag
                const contentsOpt = instance.options.getString("contents",true)
                const adminOpt = instance.options.getBoolean("admin-only",false) ?? false
                const autoOpt = instance.options.getBoolean("auto",false) ?? false
                const keywordsOpt = instance.options.getString("keywords",false)
                const keywords = keywordsOpt ? keywordsOpt.split(/ *, */g).filter((k) => k.length > 2) : []

                if (tags.getAll().find((t) => t.name.toLowerCase() == nameOpt.toLowerCase())){
                    instance.reply(await openticket.builders.messages.getSafe("openticket:error").build(source,{guild,channel,user,error:"This tag already exists! Please use another name.",layout:"simple"}))
                    return cancel()
                }
                
                const tag = new OTTag(randomHexId(tags.getIds().map((id) => id.value)),nameOpt,contentsOpt,adminOpt,autoOpt,keywords)
                tags.add(tag)
                await openticket.stats.get("openticket:global").setStat("ot-tags:tags-created",1,"increase")
                await openticket.events.get("ot-tags:onTagCreated").emit([tag,user,channel])
                await instance.reply(await openticket.builders.messages.getSafe("ot-tags:tag-created-message").build(source,{channel,user,tag}))
            
            }else if (modeOpt == "edit"){
                //edit an existing tag
                const contentsOpt = instance.options.getString("contents",true)
                const adminOpt = instance.options.getBoolean("admin-only",false) ?? false
                const autoOpt = instance.options.getBoolean("auto",false) ?? false
                const keywordsOpt = instance.options.getString("keywords",false)
                const keywords = keywordsOpt ? keywordsOpt.split(/ *, */g).filter((k) => k.length > 2) : []

                const tag = tags.getAll().find((t) => t.name.toLowerCase() == nameOpt.toLowerCase())
                if (!tag){
                    instance.reply(await openticket.builders.messages.getSafe("openticket:error").build(source,{guild,channel,user,error:"Supplied an invalid tag name. Please try again!",layout:"simple"}))
                    return cancel()
                }
                
                tag.value = contentsOpt
                tag.adminOnly = adminOpt
                tag.auto = autoOpt
                tag.keywords = keywords
                await openticket.events.get("ot-tags:onTagEdited").emit([tag,user,channel])
                await instance.reply(await openticket.builders.messages.getSafe("ot-tags:tag-edited-message").build(source,{channel,user,tag}))
            
            }else if (modeOpt == "remove"){
                //remove an existing tag
                const tag = tags.getAll().find((t) => t.name.toLowerCase() == nameOpt.toLowerCase())
                if (!tag){
                    instance.reply(await openticket.builders.messages.getSafe("openticket:error").build(source,{guild,channel,user,error:"Supplied an invalid tag name. Please try again!",layout:"simple"}))
                    return cancel()
                }
                
                tags.remove(tag.id)
                await openticket.stats.get("openticket:global").setStat("ot-tags:tags-created",1,"decrease")
                await openticket.events.get("ot-tags:onTagRemoved").emit([tag,user,channel])
                await instance.reply(await openticket.builders.messages.getSafe("ot-tags:tag-removed-message").build(source,{channel,user,tag}))
            }
        }),
        new api.ODWorker("ot-tags:logs",-1,(instance,params,source,cancel) => {
            const nameOpt = instance.options.getString("name",true)
            const modeOpt = instance.options.getSubCommand()
            const tag = tags.getAll().find((t) => t.name.toLowerCase() == nameOpt.toLowerCase())
            const tagName = tag ? tag.name : "/"

            openticket.log(instance.user.displayName+" used the 'tags "+modeOpt+"' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source},
                {key:"tag",value:tagName},
            ])
        })
    ])
})

openticket.events.get("onCodeLoad").listen((code) => {
    const tags = openticket.plugins.classes.get("ot-tags:manager")
    const tagDatabase = openticket.databases.get("ot-tags:tags")
    const version = openticket.plugins.get("ot-tags").version

    //TAG LOADER
    openticket.code.add(new api.ODCode("ot-tags:tag-loader",0,async () => {
        const rawTags = await tagDatabase.getCategory("ot-tags:tag") ?? []
        rawTags.forEach((rawTag) => {
            tags.add(OTTag.fromJson(rawTag.value as OTTagJson))
        })
    }))

    //TAG SAVER
    openticket.code.add(new api.ODCode("ot-tags:tag-saver",-1,() => {
        tags.onAdd(async (tag) => {
            await tagDatabase.set("ot-tags:tag",tag.id.value,tag.toJson(version))
        })
        tags.onChange(async (tag) => {
            await tagDatabase.set("ot-tags:tag",tag.id.value,tag.toJson(version))
        })
        tags.onRemove(async (tag) => {
            await tagDatabase.delete("ot-tags:tag",tag.id.value)
        })
    }))
})

//OTHER CLIENT EVENTS
openticket.events.get("onClientReady").listen((clientManager) => {
    const tags = openticket.plugins.classes.get("ot-tags:manager")
    const client = clientManager.client
    const config = openticket.configs.get("ot-tags:config")
    const generalConfig = openticket.configs.get("openticket:general")

    //AUTOCOMPLETE
    client.on("interactionCreate",(interaction) => {
        if (!interaction.isAutocomplete()) return
        if (interaction.commandName != "tag" && interaction.commandName != "tags") return
        const nameOpt = interaction.options.getFocused(true)
        if (nameOpt.name != "name") return

        const choices = tags.getAll().map((t) => t.name).filter((n) => n.startsWith(nameOpt.value)).map((n) => {return {name:n,value:n}})
        interaction.respond(choices)
    })

    //SMART MODE
    const tagCooldown: Map<string,boolean> = new Map()
    client.on("messageCreate",async (msg) => {
        if (msg.guildId != generalConfig.data.serverId || msg.author.id == client.user.id || msg.author.bot || msg.channel.isDMBased()) return
        const tag = tags.getAll().find((tag) => !tagCooldown.has(tag.id.value+"_"+msg.channel.id) && tag.matchKeywords(msg.content,config.data.enableSmartAutoTag))
        if (!tag) return
        const replyMsg = (await openticket.builders.messages.getSafe("ot-tags:tag-message").build("keyword",{channel:msg.channel,user:msg.author,keyword:null,tag})).message
       
        if (config.data.mentionUser) msg.reply(replyMsg)
        else msg.channel.send(replyMsg)
        await openticket.events.get("ot-tags:onAutoTagTriggered").emit([tag,msg.author,msg.channel])

        openticket.log(msg.author.displayName+" auto-triggered a tag!","plugin",[
            {key:"user",value:msg.author.username},
            {key:"userid",value:msg.author.id,hidden:true},
            {key:"channelid",value:msg.channel.id,hidden:true},
            {key:"tag",value:tag.name}
        ])

        tagCooldown.set(tag.id.value+"_"+msg.channel.id,true)
        setTimeout(() => {
            tagCooldown.delete(tag.id.value+"_"+msg.channel.id)
        },config.data.autoTagCooldownSeconds*1000)
    })
})

//REGISTER NEW STATISTICS
openticket.events.get("onStatLoad").listen((stats) => {
    stats.get("openticket:global").add(new api.ODBasicStat("ot-tags:tags-created",0,"Tags Created",0))
})


//STARTUP SCREEN
openticket.events.get("onStartScreenLoad").listen((startscreen) => {
    const tags = openticket.plugins.classes.get("ot-tags:manager")
    const stats = startscreen.get("openticket:stats")
    if (!stats) return

    //insert tags startup info before "help" stat.
    const newProperties = [
        ...stats.properties.slice(0,5),
        {key:"tags",value:"loaded "+ansis.bold(tags.getLength().toString())+" tags!"},
        ...stats.properties.slice(5)
    ]
    stats.properties = newProperties
})