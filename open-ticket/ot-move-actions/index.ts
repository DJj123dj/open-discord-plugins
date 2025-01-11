import { api, openticket, utilities } from "#opendiscord";
import * as discord from "discord.js";
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
class OTMoveActionsConfig extends api.ODJsonConfig {
    declare data: {
        unclaimOnMove:boolean,
        unpinOnMove:boolean
    }
}
declare module "#opendiscord-types" {
    export interface ODConfigManagerIds_Default {
        "ot-move-actions:config": OTMoveActionsConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-move-actions:config": api.ODChecker
    }
}

//REGISTER CONFIG
openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTMoveActionsConfig("ot-move-actions:config","config.json","./plugins/ot-move-actions/"))
})

//REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-move-actions:config")
    checkers.add(new api.ODChecker("ot-move-actions:config",checkers.storage,0,config,new api.ODCheckerObjectStructure("ot-move-actions:config",{children:[
        {key:"unclaimOnMove",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-move-actions:unclaim-on-move",{})},
        {key:"unpinOnMove",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-move-actions:unpin-on-move",{})}
    ]})))
})

//TRIGGER AFTER TICKET MOVED
openticket.events.get("afterTicketMoved").listen((ticket,mover,channel,reason) => {
    const config = openticket.configs.get("ot-move-actions:config")

    //unclaim ticket
    if (config.data.unclaimOnMove && ticket.get("openticket:claimed").value){
        openticket.actions.get("openticket:unclaim-ticket").run("other",{guild:channel.guild,channel,user:mover,ticket,reason:"Auto Unclaim",sendMessage:true})
    }

    //unpin ticket
    if (config.data.unpinOnMove && ticket.get("openticket:pinned").value){
        openticket.actions.get("openticket:unpin-ticket").run("other",{guild:channel.guild,channel,user:mover,ticket,reason:"Auto Unpin",sendMessage:true})
    }
})