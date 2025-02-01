import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
class OTVolumeWarningConfig extends api.ODJsonConfig {
    declare data: {
        amountOfTicketsBeforeWarning: number,
        customMessage: {
            enabled: boolean,
            ping: boolean,
            text: string,
            embed: {
                enabled: boolean,
                title: string,
                titleEmoji: string,
                description: string,
                customColor: discord.ColorResolvable,
                image: string,
                thumbnail: string,
                fields: {
                    name: string,
                    value: string,
                    inline: boolean
                }[]
                timestamp: boolean
            }
        }
    }
}

declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-volume-warning":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-volume-warning:config":OTVolumeWarningConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-volume-warning:config":api.ODChecker;
    }
    export interface ODMessageManagerIds_Default {
        "ot-volume-warning:delay-warning-message":{source:"ticket"|"other",params:{user:discord.User},workers:"ot-volume-warning:delay-warning-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-volume-warning:delay-warning-embed":{source:"ticket"|"other",params:{user:discord.User,custom:boolean},workers:"ot-volume-warning:delay-warning-embed"},
    }
}

//REGISTER CONFIG
opendiscord.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTVolumeWarningConfig("ot-volume-warning:config","config.json","./plugins/ot-volume-warning/"));
})

const delayWarningConfigStructure = new api.ODCheckerObjectStructure("ot-volume-warning:config",{children:[
    {key:"amountOfTicketsBeforeWarning",optional:false,priority:0,checker:new api.ODCheckerNumberStructure("ot-volume-warning:limit",{min:0,floatAllowed:false,negativeAllowed:false,zeroAllowed:true})},

    {key:"customMessage",optional:false,priority:0,checker:new api.ODCheckerEnabledObjectStructure("ot-volume-warning:customMessage",{property:"enabled",enabledValue:true,checker:new api.ODCheckerObjectStructure("ot-volume-warning:customMessage",{children:[
        {key:"ping",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-volume-warning:ping",{})},
        {key:"text",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-volume-warning:text",{maxLength:4096})},

        {key:"embed",optional:false,priority:0,checker:new api.ODCheckerEnabledObjectStructure("ot-volume-warning:embed",{property:"enabled",enabledValue:true,checker:new api.ODCheckerObjectStructure("ot-volume-warning:embed",{children:[
            {key:"title",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-volume-warning:embed-text",{maxLength:256})},
            {key:"titleEmoji",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_EmojiString("ot-volume-warning:embed-title-emoji",0,1,true)},
            {key:"description",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-volume-warning:embed-description",{maxLength:4096})},
            {key:"customColor",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_HexColor("ot-volume-warning:embed-color",true,true)},
    
            {key:"image",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-volume-warning:embed-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
            {key:"thumbnail",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-volume-warning:embed-thumbnail",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
            
            {key:"fields",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-volume-warning:embed-fields",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("opendiscord:panel-embed-fields",{children:[
                {key:"name",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-volume-warning:embed-field-name",{minLength:1,maxLength:256})},
                {key:"value",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-volume-warning:embed-field-value",{minLength:1,maxLength:1024})},
                {key:"inline",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-volume-warning:embed-field-inline",{})}
            ]})})},
            {key:"timestamp",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-volume-warning:embed-timestamp",{})}
        ]})})}
    ]})})}
]});

//REGISTER CONFIG CHECKER
opendiscord.events.get("onCheckerLoad").listen((checkers) => {
    const config = opendiscord.configs.get("ot-volume-warning:config")
    checkers.add(new api.ODChecker("ot-volume-warning:config",checkers.storage,0,config,delayWarningConfigStructure))
})

//REGISTER EMBED BUILDER
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")
    const config = opendiscord.configs.get("ot-volume-warning:config")

    embeds.add(new api.ODEmbed("ot-volume-warning:delay-warning-embed"))
    embeds.get("ot-volume-warning:delay-warning-embed").workers.add(
        new api.ODWorker("ot-volume-warning:delay-warning-embed",0,(instance,params,source,cancel) => {
            const { custom } = params;

            if(!custom) {
                const titleText = utilities.emojiTitle("⏳","Increased Response Times")
                const embedColor = generalConfig.data.mainColor
                const description = "We are currently experiencing a high ticket demand. This may result in longer response times than usual.\nWe appreciate your patience and will assist you as soon as possible."
            
                instance.setTitle(titleText)
                instance.setColor(embedColor)
                instance.setDescription(description)
            } else {
                const { title, titleEmoji, description, customColor, image, thumbnail, fields, timestamp } = config.data.customMessage.embed
        
                if(titleEmoji) instance.setTitle(utilities.emojiTitle(titleEmoji,title))
                else instance.setTitle(title)

                instance.setColor(customColor ? customColor : generalConfig.data.mainColor)

                if(description) instance.setDescription(description)
                if(image) instance.setImage(image)
                if(thumbnail) instance.setThumbnail(thumbnail)
                if(fields) instance.setFields(fields)
                if(timestamp) instance.setTimestamp(new Date())
            }
        })
    )
})

//REGISTER MESSAGE BUILDER
opendiscord.events.get("onMessageBuilderLoad").listen((messages) => {
    const config = opendiscord.configs.get("ot-volume-warning:config")

    messages.add(new api.ODMessage("ot-volume-warning:delay-warning-message"))
    messages.get("ot-volume-warning:delay-warning-message").workers.add(
        new api.ODWorker("ot-volume-warning:delay-warning-message",0,async (instance,params,source,cancel) => {
            const { user } = params

            const customMessage = config.data.customMessage;
            if(customMessage.enabled) {
                //custom message
                const content = `${customMessage.ping ? `${discord.userMention(user.id)} ` : ""}${customMessage.text}`;
                if(content) instance.setContent(content);
                if(customMessage.embed.enabled) instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-volume-warning:delay-warning-embed").build(source,{user,custom:true}));
            
            }else{
                //pre-made message
                instance.addEmbed(await opendiscord.builders.embeds.getSafe("ot-volume-warning:delay-warning-embed").build(source,{user,custom:false}));
            }
        })
    )
})

//LISTEN FOR TICKET CREATION
opendiscord.events.get("afterTicketCreated").listen(async (ticket, creator, channel) => {
    const config = opendiscord.configs.get("ot-volume-warning:config")
    
    const currentlyOpenTickets = opendiscord.tickets.getFiltered((ticket) => !ticket.get("opendiscord:closed").value).length;
    if(currentlyOpenTickets >= config.data.amountOfTicketsBeforeWarning) {
        const messageTemplate = await opendiscord.builders.messages.getSafe("ot-volume-warning:delay-warning-message").build("ticket",{user:creator});
        await channel.send(messageTemplate.message);
    }
})