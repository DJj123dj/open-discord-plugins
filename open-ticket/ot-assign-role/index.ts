import { api, opendiscord, utilities } from "#opendiscord";
import * as discord from "discord.js";
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
class OTAssignRoleConfig extends api.ODJsonConfig {
    declare data: {
        roleId:string
    }
}
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-assign-role":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-assign-role:config": OTAssignRoleConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-assign-role:config": api.ODChecker
    }
    export interface ODEventIds_Default {
        "ot-assign-role:onRoleAdded":api.ODEvent_Default<(member:discord.GuildMember) => api.ODPromiseVoid>
        "ot-assign-role:onRoleRemoved":api.ODEvent_Default<(member:discord.GuildMember) => api.ODPromiseVoid>
    }
}

//REGISTER CONFIG
opendiscord.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTAssignRoleConfig("ot-assign-role:config","config.json","./plugins/ot-assign-role/"))
})

//REGISTER CONFIG CHECKER
opendiscord.events.get("onCheckerLoad").listen((checkers) => {
    const config = opendiscord.configs.get("ot-assign-role:config")
    checkers.add(new api.ODChecker("ot-assign-role:config",checkers.storage,0,config,new api.ODCheckerObjectStructure("ot-assign-role:config",{children:[
        {key:"roleId",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_DiscordId("ot-assign-role:role-id","role",false,[])}
    ]})))
})

//CHECK IF VALID ROLE
opendiscord.events.get("onReadyForUsage").listen(async () => {
    const config = opendiscord.configs.get("ot-assign-role:config")
    const mainServer = opendiscord.client.mainServer
    if (!mainServer) return

    const role = await opendiscord.client.fetchGuildRole(mainServer,config.data.roleId)
    if (!role) opendiscord.log("The assign role ID is invalid! Please use a valid one instead!","error",[
        {key:"roleid",value:config.data.roleId}
    ])
})

//ADD ROLE ON TICKET CREATION
opendiscord.events.get("afterTicketCreated").listen(async (ticket,creator,channel) => {
    const config = opendiscord.configs.get("ot-assign-role:config")
    const mainServer = opendiscord.client.mainServer
    if (!mainServer) return

    const role = await opendiscord.client.fetchGuildRole(mainServer,config.data.roleId)
    if (!role) return opendiscord.log("Unable to give ticket creator a non-existing assign role!","error",[
        {key:"roleid",value:config.data.roleId},
        {key:"channel",value:"#"+channel.name},
        {key:"channelid",value:channel.id,hidden:true},
        {key:"user",value:creator.displayName},
        {key:"userid",value:creator.id,hidden:true},
    ])

    const member = await opendiscord.client.fetchGuildMember(mainServer,creator.id)
    if (!member) return

    await member.roles.add(role)
    opendiscord.log(creator.displayName+" has been added to the assign role!","plugin",[
        {key:"roleid",value:config.data.roleId},
        {key:"channel",value:"#"+channel.name},
        {key:"channelid",value:channel.id,hidden:true},
        {key:"user",value:creator.displayName},
        {key:"userid",value:creator.id,hidden:true},
    ])
})

//REMOVE ROLE ON TICKET DELETION
opendiscord.events.get("onTicketDelete").listen(async (ticket,deleter,channel,reason) => {
    const config = opendiscord.configs.get("ot-assign-role:config")
    const mainServer = opendiscord.client.mainServer
    if (!mainServer) return

    const creator = await opendiscord.tickets.getTicketUser(ticket,"creator")
    if (!creator) return

    //ignore role removal if creator has multiple tickets opened at the same time
    const creatorTickets = opendiscord.tickets.getFiltered((ticket) => {
        return (ticket.get("opendiscord:opened-by").value === creator.id)
    })
    if (creatorTickets.length > 1) return

    const role = await opendiscord.client.fetchGuildRole(mainServer,config.data.roleId)
    if (!role) return opendiscord.log("Unable to remove ticket creator from non-existing assign role!","error",[
        {key:"roleid",value:config.data.roleId},
        {key:"channel",value:"#"+channel.name},
        {key:"channelid",value:channel.id,hidden:true},
        {key:"user",value:creator.displayName},
        {key:"userid",value:creator.id,hidden:true},
    ])

    const member = await opendiscord.client.fetchGuildMember(mainServer,creator.id)
    if (!member) return

    await member.roles.remove(role)
    opendiscord.log(creator.displayName+" has been removed from the assign role!","plugin",[
        {key:"roleid",value:config.data.roleId},
        {key:"channel",value:"#"+channel.name},
        {key:"channelid",value:channel.id,hidden:true},
        {key:"user",value:creator.displayName},
        {key:"userid",value:creator.id,hidden:true},
    ])
})