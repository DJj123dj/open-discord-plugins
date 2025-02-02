import {api, opendiscord, utilities} from "#opendiscord"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-no-slash-clear":api.ODPlugin
    }
}

//DISABLE SLASH COMMAND REMOVAL
opendiscord.defaults.setDefault("allowSlashCommandRemoval",false)

//Yep, this is everything this plugin does :)
//You could probably better implement directly in your own plugin if you ever need it.