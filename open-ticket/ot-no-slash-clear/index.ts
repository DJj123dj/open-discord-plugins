import {api, openticket, utilities} from "#opendiscord"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DISABLE SLASH COMMAND REMOVAL
openticket.defaults.setDefault("allowSlashCommandRemoval",false)

//Yep, this is everything this plugin does :)
//You could probably better implement directly in your own plugin if you ever need it.