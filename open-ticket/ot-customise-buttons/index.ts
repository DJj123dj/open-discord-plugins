import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
export interface OTCustomiseButton {
    enableCustomisation:boolean,
    customLabel:string,
    customColor:"gray"|"red"|"green"|"blue",
    customEmoji:string
}
class OTCustomiseButtonsConfig extends api.ODJsonConfig {
    declare data: {
        close:OTCustomiseButton,
        reopen:OTCustomiseButton,
        delete:OTCustomiseButton,
        claim:OTCustomiseButton,
        unclaim:OTCustomiseButton,
        pin:OTCustomiseButton,
        unpin:OTCustomiseButton,
        withReason:OTCustomiseButton,
        withoutTranscript:OTCustomiseButton,
        verifybarSuccess:OTCustomiseButton,
        verifybarFailure:OTCustomiseButton
    }
}
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-customise-buttons":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-customise-buttons:config":OTCustomiseButtonsConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-customise-buttons:config": api.ODChecker
    }
}

//REGISTER CONFIG
opendiscord.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTCustomiseButtonsConfig("ot-customise-buttons:config","config.json","./plugins/ot-customise-buttons/"))
})

//REGISTER CONFIG CHECKER
opendiscord.events.get("onCheckerLoad").listen((checkers) => {
    const createCustomButtonCheckerStructure = (id:api.ODValidId) => {
        return new api.ODCheckerEnabledObjectStructure(id,{property:"enableCustomisation",enabledValue:true,checker:new api.ODCheckerObjectStructure(id,{children:[
            {key:"customLabel",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-customise-buttons:label",{maxLength:80})},
            {key:"customColor",optional:false,priority:0,checker:new api.ODCheckerStringStructure("ot-customise-buttons:color",{choices:["gray","red","green","blue"]})},
            {key:"customEmoji",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_EmojiString("ot-customise-buttons:emoji",0,1,true)},
        ]})}) 
    }

    const config = opendiscord.configs.get("ot-customise-buttons:config")
    const structure = new api.ODCheckerObjectStructure("ot-customise-buttons:config",{children:[
        {key:"close",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:close")},
        {key:"reopen",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:reopen")},
        {key:"delete",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:delete")},
        {key:"claim",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:claim")},
        {key:"unclaim",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:unclaim")},
        {key:"pin",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:pin")},
        {key:"unpin",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:unpin")},
        {key:"withReason",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:with-reason")},
        {key:"withoutTranscript",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:without-transcript")},
        {key:"verifybarSuccess",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:verifybar-success")},
        {key:"verifybarFailure",optional:false,priority:0,checker:createCustomButtonCheckerStructure("ot-customise-buttons:verifybar-failure")},
    ]})
    checkers.add(new api.ODChecker("ot-customise-buttons:config",checkers.storage,0,config,structure))
})

//EDIT BUTTONS
opendiscord.events.get("afterButtonBuildersLoaded").listen((buttons) => {
    const config = opendiscord.configs.get("ot-customise-buttons:config")

    //close ticket
    buttons.get("opendiscord:close-ticket").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const data = config.data.close
        if (!data.enableCustomisation) return
        instance.setColor(data.customColor)
        instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
        instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
    }))
    //reopen ticket
    buttons.get("opendiscord:reopen-ticket").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const data = config.data.reopen
        if (!data.enableCustomisation) return
        instance.setColor(data.customColor)
        instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
        instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
    }))
    //delete ticket
    buttons.get("opendiscord:delete-ticket").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const data = config.data.delete
        if (!data.enableCustomisation) return
        instance.setColor(data.customColor)
        instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
        instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
    }))
    //claim ticket
    buttons.get("opendiscord:claim-ticket").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const data = config.data.claim
        if (!data.enableCustomisation) return
        instance.setColor(data.customColor)
        instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
        instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
    }))
    //unclaim ticket
    buttons.get("opendiscord:unclaim-ticket").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const data = config.data.unclaim
        if (!data.enableCustomisation) return
        instance.setColor(data.customColor)
        instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
        instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
    }))
    //pin ticket
    buttons.get("opendiscord:pin-ticket").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const data = config.data.pin
        if (!data.enableCustomisation) return
        instance.setColor(data.customColor)
        instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
        instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
    }))
    //unpin ticket
    buttons.get("opendiscord:unpin-ticket").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const data = config.data.unpin
        if (!data.enableCustomisation) return
        instance.setColor(data.customColor)
        instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
        instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
    }))

    //verifybar success (including "... with reason" & "delete without transcript")
    buttons.get("opendiscord:verifybar-success").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const {customData,customColor,customEmoji,customLabel} = params

        if (customData == "reason"){
            const data = config.data.withReason
            if (!data.enableCustomisation) return
            instance.setColor(data.customColor)
            instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
            instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
        }else if (customData == "no-transcript"){
            const data = config.data.withoutTranscript
            if (!data.enableCustomisation) return
            instance.setColor(data.customColor)
            instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
            instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
        }else if (!customColor && !customEmoji && !customLabel){
            const data = config.data.verifybarSuccess
            if (!data.enableCustomisation) return
            instance.setColor(data.customColor)
            instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
            instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
        }
    }))
    //verifybar failure
    buttons.get("opendiscord:verifybar-failure").workers.add(new api.ODWorker("ot-customise-buttons:edit-button",1,(instance,params,source,cancel) => {
        const {customColor,customEmoji,customLabel} = params
        if (!customColor && !customEmoji && !customLabel){
            const data = config.data.verifybarFailure
            if (!data.enableCustomisation) return
            instance.setColor(data.customColor)
            instance.setLabel((data.customLabel.length > 0) ? data.customLabel : null)
            instance.setEmoji((data.customEmoji.length > 0) ? data.customEmoji : null)
        }
    }))
})