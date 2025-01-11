import {api, openticket, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
class OTEphemeralMessagesConfig extends api.ODJsonConfig {
    declare data: {
        ticketCreatedEphemeral:boolean,
        ticketClosedEphemeral:boolean,
        ticketReopenedEphemeral:boolean,
        ticketDeletedEphemeral:boolean,
        ticketClaimedEphemeral:boolean,
        ticketUnclaimedEphemeral:boolean,
        ticketPinnedEphemeral:boolean,
        ticketUnpinnedEphemeral:boolean,
        ticketMovedEphemeral:boolean,
        ticketRenamedEphemeral:boolean,
        ticketUserAddedEphemeral:boolean,
        ticketUserRemovedEphemeral:boolean,

        helpEphemeral:boolean,
        clearEphemeral:boolean,

        statsGlobalEphemeral:boolean,
        statsUserEphemeral:boolean,
        statsTicketEphemeral:boolean,

        blacklistViewEphemeral:boolean,
        blacklistGetEphemeral:boolean,
        blacklistAddEphemeral:boolean,
        blacklistRemoveEphemeral:boolean,

        autocloseEnabledEphemeral:boolean,
        autocloseDisabledEphemeral:boolean,
        autodeleteEnabledEphemeral:boolean,
        autodeleteDisabledEphemeral:boolean,

        pluginIntegrations:{
            "OTConfigReload_reloadEphemeral":boolean,
            "OTJumpToTop_topEphemeral":boolean,
            "OTKillSwitch_killEphemeral":boolean
        }
    }
}
declare module "#opendiscord-types" {
    export interface ODConfigManagerIds_Default {
        "ot-ephemeral-messages:config":OTEphemeralMessagesConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-ephemeral-messages:config": api.ODChecker
    }
}

//REGISTER CONFIG
openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTEphemeralMessagesConfig("ot-ephemeral-messages:config","config.json","./plugins/ot-ephemeral-messages/"))
})

//REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-ephemeral-messages:config")
    const structure = new api.ODCheckerObjectStructure("ot-ephemeral-messages:config",{children:[
        {key:"ticketCreatedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketClosedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketReopenedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketDeletedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketClaimedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketUnclaimedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketPinnedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketUnpinnedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketMovedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketRenamedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketUserAddedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"ticketUserRemovedEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        
        {key:"helpEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"clearEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        
        {key:"statsGlobalEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"statsUserEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"statsTicketEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        
        {key:"blacklistViewEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"blacklistGetEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"blacklistAddEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"blacklistRemoveEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        
        {key:"autocloseEnabledEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"autocloseDisabledEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"autodeleteEnabledEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        {key:"autodeleteDisabledEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},

        {key:"pluginIntegrations",optional:false,priority:0,checker:new api.ODCheckerObjectStructure("ot-ephemeral-messages:integrations",{children:[
            {key:"OTConfigReload_reloadEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
            {key:"OTJumpToTop_topEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
            {key:"OTKillSwitch_killEphemeral",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-ephemeral-messages:ephemeral",{})},
        ]})}
    ]})
    checkers.add(new api.ODChecker("ot-ephemeral-messages:config",checkers.storage,0,config,structure))
})

//EDIT MESSAGES
openticket.events.get("afterMessageBuildersLoaded").listen((messages) => {
    const config = openticket.configs.get("ot-ephemeral-messages:config")

    //ticket created (reply)
    messages.get("openticket:ticket-created").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketCreatedEphemeral)
    }))

    //ticket close message
    messages.get("openticket:close-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketClosedEphemeral)
    }))

    //ticket reopen message
    messages.get("openticket:reopen-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketReopenedEphemeral)
    }))

    //ticket delete message
    messages.get("openticket:delete-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketDeletedEphemeral)
    }))

    //ticket claim message
    messages.get("openticket:claim-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketClaimedEphemeral)
    }))

    //ticket unclaim message
    messages.get("openticket:unclaim-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketUnclaimedEphemeral)
    }))

    //ticket pin message
    messages.get("openticket:pin-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketPinnedEphemeral)
    }))

    //ticket unpin message
    messages.get("openticket:unpin-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketUnpinnedEphemeral)
    }))

    //ticket move message
    messages.get("openticket:move-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketMovedEphemeral)
    }))

    //ticket rename message
    messages.get("openticket:rename-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketRenamedEphemeral)
    }))

    //ticket add message
    messages.get("openticket:add-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketUserAddedEphemeral)
    }))

    //ticket remove message
    messages.get("openticket:remove-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.ticketUserRemovedEphemeral)
    }))

    //help menu
    messages.get("openticket:help-menu").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.helpEphemeral)
    }))

    //clear command
    messages.get("openticket:clear-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.clearEphemeral)
    }))

    //stats global command
    messages.get("openticket:stats-global").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.statsGlobalEphemeral)
    }))

    //stats user command
    messages.get("openticket:stats-user").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.statsUserEphemeral)
    }))

    //stats ticket command
    messages.get("openticket:stats-ticket").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.statsTicketEphemeral)
    }))

    //blacklist view command
    messages.get("openticket:blacklist-view").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.blacklistViewEphemeral)
    }))

    //blacklist get command
    messages.get("openticket:blacklist-get").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.blacklistGetEphemeral)
    }))

    //blacklist add command
    messages.get("openticket:blacklist-add").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.blacklistAddEphemeral)
    }))

    //blacklist remove command
    messages.get("openticket:blacklist-remove").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.blacklistRemoveEphemeral)
    }))

    //autoclose enabled command
    messages.get("openticket:autoclose-enable").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.autocloseEnabledEphemeral)
    }))

    //autoclose disabled command
    messages.get("openticket:autoclose-disable").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.autocloseDisabledEphemeral)
    }))

    //autodelete enabled command
    messages.get("openticket:autodelete-enable").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.autodeleteEnabledEphemeral)
    }))

    //autodelete disabled command
    messages.get("openticket:autodelete-disable").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(config.data.autodeleteDisabledEphemeral)
    }))

    //PLUGIN INTEGRATIONS
    if (openticket.plugins.isPluginLoaded("ot-config-reload")){
        //OT Config Reload
        messages.get("ot-config-reload:config-reload-result").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
            instance.setEphemeral(config.data.pluginIntegrations["OTConfigReload_reloadEphemeral"])
        }))
    }
    if (openticket.plugins.isPluginLoaded("ot-jump-to-top")){
        //OT Jump To Top
        messages.get("ot-jump-to-top:top-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
            instance.setEphemeral(config.data.pluginIntegrations["OTJumpToTop_topEphemeral"])
        }))
    }
    if (openticket.plugins.isPluginLoaded("ot-kill-switch")){
        //OT Kill Switch
        messages.get("ot-kill-switch:kill-message").workers.add(new api.ODWorker("ot-ephemeral-messages:edit-message",1,(instance,params,source,cancel) => {
            instance.setEphemeral(config.data.pluginIntegrations["OTKillSwitch_killEphemeral"])
        }))
    }
})


//EDIT RESPONDERS (to support ephemeral when using deferReply())
openticket.events.get("afterCommandRespondersLoaded").listen((commands) => {
    const config = openticket.configs.get("ot-ephemeral-messages:config")

    commands.get("openticket:ticket").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketCreatedEphemeral) await instance.defer(true)
    }))

    //primary ticket actions
    commands.get("openticket:close").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketClosedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:reopen").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketReopenedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:delete").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketDeletedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:claim").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketClaimedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:unclaim").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketUnclaimedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:pin").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketPinnedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:unpin").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketUnpinnedEphemeral) await instance.defer(true)
    }))

    //other ticket actions
    commands.get("openticket:move").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketMovedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:rename").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketRenamedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:add").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketUserAddedEphemeral) await instance.defer(true)
    }))
    commands.get("openticket:remove").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.ticketUserRemovedEphemeral) await instance.defer(true)
    }))

    //clear command
    commands.get("openticket:clear").workers.add(new api.ODWorker("ot-ephemeral-messages:defer-ephemeral",2,async (instance,params,source,cancel) => {
        if (config.data.clearEphemeral) await instance.defer(true)
    }))
})