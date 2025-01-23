import {api, openticket, utilities} from "#opendiscord"
import * as discord from "discord.js"
import {AltDetector, AltDetectorResult} from "discord-alt-detector"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

///////// ADVANCED ///////////
const showRawOutput = false //show the raw alt detector output in the embed.
//////////////////////////////

//DECLARATION
export class OTAltDetector extends api.ODManagerData {
    detector: AltDetector

    constructor(id:api.ODValidId,detector:AltDetector){
        super(id)
        this.detector = detector
    }
}
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-alt-detector":api.ODPlugin
    }
    export interface ODMessageManagerIds_Default {
        "ot-alt-detector:log-message":{source:"other",params:{member:discord.GuildMember,result:AltDetectorResult},workers:"ot-alt-detector:log-message"},
    }
    export interface ODEmbedManagerIds_Default {
        "ot-alt-detector:log-embed":{source:"other",params:{member:discord.GuildMember,result:AltDetectorResult},workers:"ot-alt-detector:log-embed"},
    }
    export interface ODEventIds_Default {
        "ot-alt-detector:onAltDetect":api.ODEvent_Default<(member:discord.GuildMember) => api.ODPromiseVoid>
        "ot-alt-detector:afterAltDetected":api.ODEvent_Default<(member:discord.GuildMember, result:AltDetectorResult) => api.ODPromiseVoid>
    }
    export interface ODPluginClassManagerIds_Default {
        "ot-alt-detector:detector": OTAltDetector
    }
}

//REGISTER PLUGIN CLASS
openticket.events.get("onPluginClassLoad").listen((classes) => {
    classes.add(new OTAltDetector("ot-alt-detector:detector",new AltDetector()))
})

//REGISTER EMBED BUILDER
openticket.events.get("onEmbedBuilderLoad").listen((embeds) => {
    embeds.add(new api.ODEmbed("ot-alt-detector:log-embed"))
    embeds.get("ot-alt-detector:log-embed").workers.add(
        new api.ODWorker("ot-alt-detector:log-embed",0,(instance,params,source,cancel) => {
            const {result,member} = params
            const generalConfig = openticket.configs.get("openticket:general")
            const {detector} = openticket.plugins.classes.get("ot-alt-detector:detector")
            
            const category = detector.getCategory(result)
            const details = JSON.stringify(result.categories)

            instance.setTitle(utilities.emojiTitle("📌","Alt Detector Logs"))
            instance.setColor(generalConfig.data.mainColor)
            instance.setDescription(discord.userMention(member.id)+" joined the server!")
            instance.setThumbnail(member.displayAvatarURL())
            instance.setAuthor(member.displayName,member.displayAvatarURL())
            instance.setFooter(member.user.username+" - "+member.id)
            instance.setTimestamp(new Date())

            instance.addFields(
                {name:"Account Age",value:discord.time(member.user.createdAt,"f"),inline:true},
                {name:"Trust Level",value:"```"+category+"```",inline:true},
            )
            if (showRawOutput) instance.addFields({name:"Trust Details",value:"```"+details+"```",inline:false})
        })
    )
})

//REGISTER MESSAGE BUILDER
openticket.events.get("onMessageBuilderLoad").listen((messages) => {
    messages.add(new api.ODMessage("ot-alt-detector:log-message"))
    messages.get("ot-alt-detector:log-message").workers.add(
        new api.ODWorker("ot-alt-detector:log-message",0,async (instance,params,source,cancel) => {
            const {result,member} = params
            instance.addEmbed(await openticket.builders.embeds.getSafe("ot-alt-detector:log-embed").build(source,{result,member}))
        })
    )
})

//LISTEN FOR MEMBER JOIN
openticket.events.get("onClientReady").listen((clientManager) => {
    const {client} = clientManager
    const generalConfig = openticket.configs.get("openticket:general")
    const {detector} = openticket.plugins.classes.get("ot-alt-detector:detector")

    //send result to log channel when logging is enabled
    client.on("guildMemberAdd",async (member) => {
        if (generalConfig.data.system.logs.enabled){
            const logChannel = openticket.posts.get("openticket:logs")
            if (!logChannel) return
            
            const result = detector.check(member)
            await logChannel.send(await openticket.builders.messages.getSafe("ot-alt-detector:log-message").build("other",{result,member}))
        }
    })
})