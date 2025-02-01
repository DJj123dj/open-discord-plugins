import {api, opendiscord, utilities} from "#opendiscord"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-rename-keep-prefix":api.ODPlugin
    }
}

//REGISTER WORKER 
opendiscord.events.get("afterActionsLoaded").listen((actions) => {
    //get ticket rename action
    actions.get("opendiscord:rename-ticket").workers.add(
        //add new worker with priority 3 (above default ones)
        new api.ODWorker("ot-rename-keep-prefix:keep",3,(instance,params,source,cancel) => {
            //get ticket prefix
            const prefix = params.ticket.option.get("opendiscord:channel-prefix").value
            //update data before rename workers are executed
            params.data = prefix+params.data
        })
    )
})

//UPDATE REPLY EMBED
opendiscord.events.get("afterEmbedBuildersLoaded").listen((embeds) => {
    //get ticket rename embed
    embeds.get("opendiscord:rename-message").workers.add(
        //add new worker with priority 1 (above default ones)
        new api.ODWorker("opendiscord:channel-prefix",1,(instance,params,source,cancel) => {
            //get ticket prefix
            const prefix = params.ticket.option.get("opendiscord:channel-prefix").value
            
            //rewrite the embed description with the updated data
            const data = prefix+params.data
            instance.setDescription(opendiscord.languages.getTranslationWithParams("actions.descriptions.rename",["`#"+data+"`"]))
        })
    )
})