import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
class OTReviewsConfig extends api.ODJsonConfig {
    declare data: {
        _INFO:string,
    
        channel:string,
        reviewMode:"one-per-ticket"|"unlimited-per-ticket"|"unrestricted",
        
        enableRating:boolean,
        enableImages:boolean,
        enableAuthor:boolean,
        allowBlacklisted:boolean,

        customisation:{
            title:string,
            ratingTitle:string,
            reviewTitle:string,
            
            customColor:discord.ColorResolvable,
            url:string,
            thumbnail:string,
            footer:string,
            timestamp:boolean
        }
    }
}
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-reviews":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-reviews:config": OTReviewsConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-reviews:config": api.ODChecker
    }
    export interface ODSlashCommandManagerIds_Default {
        "ot-reviews:review":api.ODSlashCommand
    }
    export interface ODTextCommandManagerIds_Default {
        "ot-reviews:review":api.ODTextCommand
    }
    export interface ODCommandResponderManagerIds_Default {
        "ot-reviews:review":{source:"slash"|"text",params:{},workers:"ot-reviews:permissions"|"ot-reviews:review"|"ot-reviews:logs"},
    }
    export interface ODPostManagerIds_Default {
        "ot-reviews:reviews":api.ODPost<discord.GuildTextBasedChannel>
    }
    export interface ODMessageManagerIds_Default {
        "ot-reviews:review-message":{source:"slash"|"text"|"other",params:{user:discord.User,channel:discord.GuildTextBasedChannel,review:string,rating:number|null,image:discord.Attachment|null},workers:"ot-reviews:review-message"},
        "ot-reviews:response-message":{source:"slash"|"text"|"other",params:{user:discord.User,channel:discord.GuildTextBasedChannel,review:string,rating:number|null,image:discord.Attachment|null},workers:"ot-reviews:response-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-reviews:review-embed":{source:"slash"|"text"|"other",params:{user:discord.User,channel:discord.GuildTextBasedChannel,review:string,rating:number|null,image:discord.Attachment|null},workers:"ot-reviews:review-embed"},
        "ot-reviews:response-embed":{source:"slash"|"text"|"other",params:{user:discord.User,channel:discord.GuildTextBasedChannel,review:string,rating:number|null,image:discord.Attachment|null},workers:"ot-reviews:response-embed"},
    }
    export interface ODEventIds_Default {
        "ot-reviews:onReview":api.ODEvent_Default<(user:discord.User,review:string,rating:number|null,image:discord.Attachment|null) => api.ODPromiseVoid>
        "ot-reviews:afterReview":api.ODEvent_Default<(user:discord.User,review:string,rating:number|null,image:discord.Attachment|null) => api.ODPromiseVoid>
    }
    export interface ODStatGlobalScopeIds_DefaultGlobal {
        "ot-reviews:reviews-created":api.ODBasicStat
    }
    export interface ODStatScopeIds_DefaultUser {
        "ot-reviews:reviews-created":api.ODBasicStat
    }
}

//REGISTER CONFIG
opendiscord.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTReviewsConfig("ot-reviews:config","config.json","./plugins/ot-reviews/"))
})

//REGISTER CONFIG CHECKER
opendiscord.events.get("onCheckerLoad").listen((checkers) => {
    const config = opendiscord.configs.get("ot-reviews:config")
    const structure = new api.ODCheckerObjectStructure("ot-reviews:config",{children:[
        {key:"channel",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_DiscordId("ot-reviews:channel","channel",false,[],{})},
        {key:"reviewMode",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-reviews:mode",{choices:["one-per-ticket","unlimited-per-ticket","unrestricted"]})},
        
        {key:"enableRating",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-reviews:enable-rating",{})},
        {key:"enableImages",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-reviews:enable-images",{})},
        {key:"enableAuthor",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-reviews:enable-author",{})},
        {key:"allowBlacklisted",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-reviews:allow-blacklist",{})},
        
        {key:"customisation",optional:false,priority:0,checker:new api.ODCheckerObjectStructure("ot-reviews:customisation",{children:[
            {key:"title",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-reviews:embed-title",{minLength:1,maxLength:256})},
            {key:"ratingTitle",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-reviews:embed-rating-title",{minLength:1,maxLength:256})},
            {key:"reviewTitle",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-reviews:embed-review-title",{minLength:1,maxLength:256})},
            
            {key:"customColor",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_HexColor("ot-reviews:embed-color",true,true)},
            {key:"url",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-reviews:embed-url",true,{allowHttp:false})},
            {key:"thumbnail",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-reviews:embed-thumbnail",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
            {key:"footer",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-reviews:embed-footer",{maxLength:2048})},
            {key:"timestamp",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-reviews:embed-timestamp",{})}
        ]})}
    ]})
    checkers.add(new api.ODChecker("ot-reviews:config",checkers.storage,0,config,structure))
})

//REGISTER SLASH COMMAND
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    const config = opendiscord.configs.get("ot-reviews:config")
    const options: discord.ApplicationCommandOptionData[] = [{
        name:"text",
        type:discord.ApplicationCommandOptionType.String,
        description:"Please write your review.",
        required:true
    }]
    if (config.data.enableRating) options.push({
        name:"rating",
        type:discord.ApplicationCommandOptionType.String,
        description:"How do you rate our service?",
        required:true,
        choices:[
            {name:"⭐️",value:"1"},
            {name:"⭐️⭐️",value:"2"},
            {name:"⭐️⭐️⭐️",value:"3"},
            {name:"⭐️⭐️⭐️⭐️",value:"4"},
            {name:"⭐️⭐️⭐️⭐️⭐️",value:"5"}
        ]
    })
    if (config.data.enableImages) options.push({
        name:"image",
        type:discord.ApplicationCommandOptionType.Attachment,
        description:"Provide an optional image to your review.",
        required:false,
    })
    
    slash.add(new api.ODSlashCommand("ot-reviews:review",{
        name:"review",
        description:"Write a review!",
        type:discord.ApplicationCommandType.ChatInput,
        options:options,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall]
    }))
})

//REGISTER HELP MENU
opendiscord.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("ot-reviews:review",0,{
        slashName:"review",
        slashDescription:"Write a review!",
    }))
})

//REGISTER POST (reviews channel)
opendiscord.events.get("onPostLoad").listen((posts) => {
    const config = opendiscord.configs.get("ot-reviews:config")
    posts.add(new api.ODPost("ot-reviews:reviews",config.data.channel))
})

//REGISTER EMBED BUILDER
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    const config = opendiscord.configs.get("ot-reviews:config")

    embeds.add(new api.ODEmbed("ot-reviews:review-embed"))
    embeds.get("ot-reviews:review-embed").workers.add(
        new api.ODWorker("ot-reviews:review-embed",0,(instance,params,source,cancel) => {
            const generalConfig = opendiscord.configs.get("opendiscord:general")
            instance.setTitle(utilities.emojiTitle("💬",config.data.customisation.title))
            instance.setColor(config.data.customisation.customColor ? config.data.customisation.customColor : generalConfig.data.mainColor)
            instance.setDescription(params.review)
            
            if (config.data.customisation.url) instance.setUrl(config.data.customisation.url)
            if (config.data.customisation.thumbnail) instance.setThumbnail(config.data.customisation.thumbnail)
            if (config.data.customisation.timestamp) instance.setTimestamp(new Date())
            if (config.data.customisation.footer) instance.setFooter(config.data.customisation.footer)
            
            if (config.data.enableAuthor) instance.setAuthor(params.user.displayName,params.user.displayAvatarURL())        
            if (config.data.enableImages && params.image) instance.setImage(params.image.url)
            if (config.data.enableRating && params.rating) instance.addFields({name:config.data.customisation.ratingTitle,value:":star:".repeat(params.rating)})
        })
    )

    embeds.add(new api.ODEmbed("ot-reviews:response-embed"))
    embeds.get("ot-reviews:response-embed").workers.add(
        new api.ODWorker("ot-reviews:response-embed",0,(instance,params,source,cancel) => {
            const generalConfig = opendiscord.configs.get("opendiscord:general")
            instance.setTitle(utilities.emojiTitle("💬","Review Created"))
            instance.setColor(config.data.customisation.customColor ? config.data.customisation.customColor : generalConfig.data.mainColor)
            instance.setDescription("Your review has been created successfully!")
            if (config.data.customisation.timestamp) instance.setTimestamp(new Date())

            instance.addFields({name:"Review:",value:params.review})
            if (config.data.enableImages && params.image) instance.setImage(params.image.url)
            if (config.data.enableRating && params.rating) instance.addFields({name:config.data.customisation.ratingTitle,value:":star:".repeat(params.rating)})
        })
    )
})

//REGISTER MESSAGE BUILDER
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-reviews:review-message"))
    messages.get("ot-reviews:review-message").workers.add(
        new api.ODWorker("ot-reviews:review-message",0,async (instance,params,source,cancel) => {
            const {user,channel,review,rating,image} = params
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-reviews:review-embed").build(source,{user,channel,review,rating,image}))
        })
    )

    messages.add(new api.ODMessage("ot-reviews:response-message"))
    messages.get("ot-reviews:response-message").workers.add(
        new api.ODWorker("ot-reviews:response-message",0,async (instance,params,source,cancel) => {
            const {user,channel,review,rating,image} = params
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-reviews:response-embed").build(source,{user,channel,review,rating,image}))
            instance.setEphemeral(true)
        })
    )
})

//REGISTER COMMAND RESPONDER
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")
    const config = opendiscord.configs.get("ot-reviews:config")

    commands.add(new api.ODCommandResponder("ot-reviews:review",generalConfig.data.prefix,"review"))
    commands.get("ot-reviews:review").workers.add([
        new api.ODWorker("ot-reviews:permissions",1,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            const reviewsCreated = (await opendiscord.stats.get("opendiscord:user").getStat("ot-reviews:reviews-created",user.id)) as number|null ?? 0
            const ticketsCreated = (await opendiscord.stats.get("opendiscord:user").getStat("opendiscord:tickets-created",user.id)) as number|null ?? 0
            
            if (!config.data.allowBlacklisted && opendiscord.blacklist.exists(user.id)){
                opendiscord.log(user.displayName+" tried to create a review but is blacklisted!","info",[
                    {key:"user",value:user.username},
                    {key:"userid",value:user.id,hidden:true},
                    {key:"review",value:instance.options.getString("text",true)}
                ])
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"You're unable to create a review when you are blacklisted.",layout:"simple"}))
                return cancel()
            }

            if (config.data.reviewMode == "one-per-ticket" && reviewsCreated >= ticketsCreated){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"You can only create a review when you've created a ticket.",layout:"simple"}))
                return cancel()
            }else if (config.data.reviewMode == "unlimited-per-ticket" && ticketsCreated < 1){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"You can only create a review when you've created at least 1 ticket.",layout:"simple"}))
                return cancel()
            }else return
        }),
        new api.ODWorker("ot-reviews:review",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            if (!guild || channel.isDMBased()){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-not-in-guild").build(source,{channel,user}))
                return cancel()
            }
            if (!(instance.interaction instanceof discord.ChatInputCommandInteraction)) return cancel()
            
            const review = instance.options.getString("text",true)
            const rating = (config.data.enableRating) ? Number(instance.options.getString("rating",true)) : null
            let image = (config.data.enableImages) ? instance.interaction.options.getAttachment("image",false) : null
            
            //ignore image when content type is not a valid image
            if (image && (!image.contentType || !["image/png","image/jpg","image/jpeg","image/webp","image/gif"].includes(image.contentType))){
                image = null
            }

            await opendiscord.events.get("ot-reviews:onReview").emit([user,review,rating,image])

            //update stats
            await opendiscord.stats.get("opendiscord:global").setStat("ot-reviews:reviews-created",1,"increase")
            await opendiscord.stats.get("opendiscord:user").setStat("ot-reviews:reviews-created",user.id,1,"increase")

            //reply to command
            await instance.reply(await opendiscord.builders.messages.getSafe("ot-reviews:response-message").build(source,{user,channel,review,rating,image}))
            
            //send review
            await opendiscord.posts.get("ot-reviews:reviews").send(await opendiscord.builders.messages.getSafe("ot-reviews:review-message").build(source,{user,channel,review,rating,image}))
            await opendiscord.events.get("ot-reviews:afterReview").emit([user,review,rating,image])
        }),
        new api.ODWorker("ot-reviews:logs",-1,(instance,params,source,cancel) => {
            opendiscord.log(instance.user.displayName+" used the 'review' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source},
                {key:"review",value:instance.options.getString("text",true)}
            ])
        })
    ])
})

//REGISTER NEW STATISTICS
opendiscord.events.get("onStatLoad").listen((stats) => {
    stats.get("opendiscord:global").add(new api.ODBasicStat("ot-reviews:reviews-created",0,"Reviews Created",0))
    stats.get("opendiscord:user").add(new api.ODBasicStat("ot-reviews:reviews-created",0,"Reviews Created",0))
})