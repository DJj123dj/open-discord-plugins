import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
class OTFootersConfig extends api.ODJsonConfig {
    declare data: {
        generalFooter:{
            enabled:boolean,
            includePluginEmbeds:boolean,
            footer:string,
            footerImage:string
        },
        dmLogsFooter:{
            enabled:boolean,
            footer:string,
            footerImage:string
        },
        logsFooter:{
            enabled:boolean,
            footer:string,
            footerImage:string
        },
        errorFooter:{
            enabled:boolean,
            footer:string,
            footerImage:string
        },
        panelFooterImages:{
            id:string,
            panelFooter:string,
            panelFooterImage:string
        }[],
        optionFooterImages:{
            id:string,
            ticketFooter:string,
            ticketFooterImage:string,
            dmFooter:string,
            dmFooterImage:string
        }[]
    }
}
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-footers":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-footers:config":OTFootersConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-footers:config":api.ODChecker
    }
}

//REGISTER CONFIG
opendiscord.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTFootersConfig("ot-footers:config","config.json","./plugins/ot-footers/"))
})

//REGISTER CONFIG CHECKER
opendiscord.events.get("onCheckerLoad").listen((checkers) => {
    const config = opendiscord.configs.get("ot-footers:config")
    
    //low priority => requires ids from panel & option config checkers
    checkers.add(new api.ODChecker("ot-footers:config",checkers.storage,-1,config,new api.ODCheckerObjectStructure("ot-footers:config",{children:[
        //GENERAL FOOTER
        {key:"generalFooter",optional:false,priority:0,checker:new api.ODCheckerEnabledObjectStructure("ot-footers:general-footer",{property:"enabled",enabledValue:true,checker:new api.ODCheckerObjectStructure("ot-footers:general-footer",{children:[
            {key:"includePluginEmbeds",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-footers:footer-include-plugins",{})},
            {key:"footer",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:footer",{minLength:3,maxLength:2048})},
            {key:"footerImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-footers:footer-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
        ]})})},

        //DM LOGS FOOTER
        {key:"dmLogsFooter",optional:false,priority:0,checker:new api.ODCheckerEnabledObjectStructure("ot-footers:dm-logs-footer",{property:"enabled",enabledValue:true,checker:new api.ODCheckerObjectStructure("ot-footers:dm-logs-footer",{children:[
            {key:"footer",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:footer",{minLength:3,maxLength:2048})},
            {key:"footerImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-footers:footer-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
        ]})})},

        //LOGS FOOTER
        {key:"logsFooter",optional:false,priority:0,checker:new api.ODCheckerEnabledObjectStructure("ot-footers:logs-footer",{property:"enabled",enabledValue:true,checker:new api.ODCheckerObjectStructure("ot-footers:logs-footer",{children:[
            {key:"footer",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:footer",{minLength:3,maxLength:2048})},
            {key:"footerImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-footers:footer-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
        ]})})},

        //ERROR FOOTER
        {key:"errorFooter",optional:false,priority:0,checker:new api.ODCheckerEnabledObjectStructure("ot-footers:error-footer",{property:"enabled",enabledValue:true,checker:new api.ODCheckerObjectStructure("ot-footers:error-footer",{children:[
            {key:"footer",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:footer",{minLength:3,maxLength:2048})},
            {key:"footerImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-footers:footer-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
        ]})})},

        //PANEL FOOTER
        {key:"panelFooterImages",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-footers:panel-footer-images",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-footers:panel-footer-image",{children:[
            {key:"id",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:panel-id",{custom:(checker,value,locationTrace,locationId,locationDocs) => {
                const lt = checker.locationTraceDeref(locationTrace)

                if (typeof value != "string") return false
                const uniqueArray: string[] = (checker.storage.get("openticket","panel-ids") === null) ? [] : checker.storage.get("openticket","panel-ids")

                if (uniqueArray.includes(value)){
                    //exists
                    return true
                }else{
                    //doesn't exist
                    checker.createMessage("opendiscord:id-non-existent","error",`The id "${value}" doesn't exist!`,lt,null,[`"${value}"`],locationId,locationDocs)
                    return false
                }
            }})},
            {key:"panelFooter",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:panel-footer",{minLength:3,maxLength:2048})},
            {key:"panelFooterImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-footers:panel-footer-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
        ]})})},

        //OPTION FOOTER
        {key:"optionFooterImages",optional:false,priority:0,checker:new api.ODCheckerArrayStructure("ot-footers:option-footer-images",{allowedTypes:["object"],propertyChecker:new api.ODCheckerObjectStructure("ot-footers:option-footer-image",{children:[
            {key:"id",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:option-id",{custom:(checker,value,locationTrace,locationId,locationDocs) => {
                const lt = checker.locationTraceDeref(locationTrace)

                if (typeof value != "string") return false
                const uniqueArray: string[] = (checker.storage.get("openticket","option-ids") === null) ? [] : checker.storage.get("openticket","option-ids")

                if (uniqueArray.includes(value)){
                    //exists
                    return true
                }else{
                    //doesn't exist
                    checker.createMessage("opendiscord:id-non-existent","error",`The id "${value}" doesn't exist!`,lt,null,[`"${value}"`],locationId,locationDocs)
                    return false
                }
            }})},
            {key:"ticketFooter",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:ticket-footer",{minLength:3,maxLength:2048})},
            {key:"ticketFooterImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-footers:ticket-footer-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
            {key:"dmFooter",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-footers:dm-footer",{minLength:3,maxLength:2048})},
            {key:"dmFooterImage",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_UrlString("ot-footers:dm-footer-image",true,{allowHttp:false,allowedExtensions:[".png",".jpg",".jpeg",".webp",".gif"]})},
        ]})})},
    ]})))
})

const errorEmbedIds: (keyof api.ODEmbedManagerIds_Default)[] = [
    "opendiscord:error",
    "opendiscord:error-option-missing",
    "opendiscord:error-option-invalid",
    "opendiscord:error-unknown-command",
    "opendiscord:error-no-permissions",
    "opendiscord:error-no-permissions-cooldown",
    "opendiscord:error-no-permissions-blacklisted",
    "opendiscord:error-no-permissions-limits",
    "opendiscord:error-responder-timeout",
    "opendiscord:error-ticket-unknown",
    "opendiscord:error-ticket-deprecated",
    "opendiscord:error-option-unknown",
    "opendiscord:error-panel-unknown",
    "opendiscord:error-not-in-guild",
    "opendiscord:error-channel-rename",
    "opendiscord:error-ticket-busy",
    "opendiscord:stats-ticket-unknown",
    "opendiscord:transcript-error",
]

const dmLogEmbedIds: (keyof api.ODEmbedManagerIds_Default)[] = [
    "opendiscord:ticket-action-dm",
    "opendiscord:blacklist-dm",
]

const logEmbedIds: (keyof api.ODEmbedManagerIds_Default)[] = [
    "opendiscord:ticket-action-logs",
    "opendiscord:clear-logs",
    "opendiscord:blacklist-logs",
    "opendiscord:ticket-created-logs"
]

//ADD FOOTERS TO EMBEDS
opendiscord.events.get("afterEmbedBuildersLoaded").listen((embeds) => {
    const config = opendiscord.configs.get("ot-footers:config")
    const filteredEmbeds = embeds.getAll()

    filteredEmbeds.forEach((embed) => {
        const id = embed.id.value as keyof api.ODEmbedManagerIds_Default

        if (id == "opendiscord:panel"){
            //PANEL FOOTER (high priority => overwrite default footer)
            embeds.get("opendiscord:panel").workers.add(new api.ODWorker("ot-footers:footer",10,(instance,params,source,cancel) => {
                const panelFooterData = config.data.panelFooterImages.find((p) => p.id == params.panel.id.value)
                if (panelFooterData) instance.setFooter(panelFooterData.panelFooter,panelFooterData.panelFooterImage)
            }))

        }else if (id == "opendiscord:ticket-message"){
            //OPTION FOOTER (ticket message)
            embeds.get("opendiscord:ticket-message").workers.add(new api.ODWorker("ot-footers:footer",-10,(instance,params,source,cancel) => {
                const optionFooterData = config.data.optionFooterImages.find((p) => p.id == params.ticket.option.id.value)
                if (optionFooterData) instance.setFooter(optionFooterData.ticketFooter,optionFooterData.ticketFooterImage)
            }))

        }else if (id == "opendiscord:ticket-created-dm"){
            //OPTION FOOTER (ticket dm)
            embeds.get("opendiscord:ticket-created-dm").workers.add(new api.ODWorker("ot-footers:footer",-10,(instance,params,source,cancel) => {
                const optionFooterData = config.data.optionFooterImages.find((p) => p.id == params.ticket.option.id.value)
                if (optionFooterData) instance.setFooter(optionFooterData.dmFooter,optionFooterData.dmFooterImage)
            }))

        }else if (config.data.errorFooter.enabled && errorEmbedIds.includes(id)){
            //ERROR FOOTER (high priority => overwrite default footer)
            embed.workers.add(new api.ODWorker("ot-footers:footer",10,(instance,params,source,cancel) => {
                instance.setFooter(config.data.errorFooter.footer,config.data.errorFooter.footerImage)
            }))

        }else if (config.data.dmLogsFooter.enabled && dmLogEmbedIds.includes(id)){
            //DM LOGS FOOTER
            embed.workers.add(new api.ODWorker("ot-footers:footer",-10,(instance,params,source,cancel) => {
                instance.setFooter(config.data.dmLogsFooter.footer,config.data.dmLogsFooter.footerImage)
            }))

        }else if (config.data.logsFooter.enabled && logEmbedIds.includes(id)){
            //LOGS FOOTER
            embed.workers.add(new api.ODWorker("ot-footers:footer",-10,(instance,params,source,cancel) => {
                instance.setFooter(config.data.logsFooter.footer,config.data.logsFooter.footerImage)
            }))

        }else if (config.data.generalFooter.enabled && id.startsWith("opendiscord:")){
            //GENERAL FOOTER (built-in)
            embed.workers.add(new api.ODWorker("ot-footers:footer",-10,(instance,params,source,cancel) => {
                instance.setFooter(config.data.generalFooter.footer,config.data.generalFooter.footerImage)
            }))

        }else if (config.data.generalFooter.enabled && config.data.generalFooter.includePluginEmbeds){
            //GENERAL FOOTER (plugins)
            embed.workers.add(new api.ODWorker("ot-footers:footer",-10,(instance,params,source,cancel) => {
                instance.setFooter(config.data.generalFooter.footer,config.data.generalFooter.footerImage)
            }))
        }
    })
})