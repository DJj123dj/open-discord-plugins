import {api, openticket, utilities} from "#opendiscord"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DISABLE DEFAULT CODE
openticket.defaults.setDefault("slashCommandRegistering",false)

//REPLACE WITH CUSTOM CODE
openticket.events.get("onSlashCommandRegister").listen(async (slash,client) => {
    //GLOBAL
    //await openticket.client.slashCommands.removeUnusedCommands() //remove all commands that aren't used
    await openticket.client.slashCommands.createNewCommands() //create all new commands that don't exist yet
    await openticket.client.slashCommands.updateExistingCommands(undefined,openticket.defaults.getDefault("forceSlashCommandRegistration")) //update all commands that need to be re-registered

    //DEFAULT SERVER
    const serverId = openticket.configs.get("openticket:general").data.serverId
    //await openticket.client.slashCommands.removeUnusedCommands(serverId) //remove all commands that aren't used
    await openticket.client.slashCommands.createNewCommands(serverId) //create all new commands that don't exist yet
    await openticket.client.slashCommands.updateExistingCommands(serverId) //update all commands that need to be re-registered
    
    await openticket.events.get("afterSlashCommandsRegistered").emit([openticket.client.slashCommands,openticket.client])
})