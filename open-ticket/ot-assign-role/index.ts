import { api, openticket, utilities } from "#opendiscord";
import * as discord from "discord.js";
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
class OTAssignRoleConfig extends api.ODJsonConfig {
    declare data: {
        roleId:string
    }
}
declare module "#opendiscord-types" {
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
openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTAssignRoleConfig("ot-assign-role:config","config.json","./plugins/ot-assign-role/"))
})

//REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-assign-role:config")
    checkers.add(new api.ODChecker("ot-assign-role:config",checkers.storage,0,config,new api.ODCheckerObjectStructure("ot-assign-role:config",{children:[
        {key:"roleId",optional:false,priority:0,checker:new api.ODCheckerCustomStructure_DiscordId("ot-assign-role:role-id","role",false,[])}
    ]})))
})

//CHECK IF VALID ROLE
openticket.events.get("onReadyForUsage").listen(async () => {
    const config = openticket.configs.get("ot-assign-role:config")
    const mainServer = openticket.client.mainServer
    if (!mainServer) return

    const role = await openticket.client.fetchGuildRole(mainServer,config.data.roleId)
    if (!role) openticket.log("The assign role ID is invalid! Please use a valid one instead!","error",[
        {key:"roleid",value:config.data.roleId}
    ])
})

//ADD ROLE ON TICKET CREATION
openticket.events.get("afterTicketCreated").listen(async (ticket,creator,channel) => {
    const config = openticket.configs.get("ot-assign-role:config")
    const mainServer = openticket.client.mainServer
    if (!mainServer) return

    const role = await openticket.client.fetchGuildRole(mainServer,config.data.roleId)
    if (!role) return openticket.log("Unable to give ticket creator a non-existing assign role!","error",[
        {key:"roleid",value:config.data.roleId},
        {key:"channel",value:"#"+channel.name},
        {key:"channelid",value:channel.id,hidden:true},
        {key:"user",value:creator.displayName},
        {key:"userid",value:creator.id,hidden:true},
    ])

    const member = await openticket.client.fetchGuildMember(mainServer,creator.id)
    if (!member) return

    await member.roles.add(role)
    openticket.log(creator.displayName+" has been added to the assign role!","plugin",[
        {key:"roleid",value:config.data.roleId},
        {key:"channel",value:"#"+channel.name},
        {key:"channelid",value:channel.id,hidden:true},
        {key:"user",value:creator.displayName},
        {key:"userid",value:creator.id,hidden:true},
    ])
})

//REMOVE ROLE ON TICKET DELETION
openticket.events.get("onTicketDelete").listen(async (ticket,deleter,channel,reason) => {
    const config = openticket.configs.get("ot-assign-role:config")
    const mainServer = openticket.client.mainServer
    if (!mainServer) return

    const creator = await openticket.tickets.getTicketUser(ticket,"creator")
    if (!creator) return

    //ignore role removal if creator has multiple tickets opened at the same time
    const creatorTickets = openticket.tickets.getFiltered((ticket) => {
        return (ticket.get("openticket:opened-by").value === creator.id)
    })
    if (creatorTickets.length > 1) return

    const role = await openticket.client.fetchGuildRole(mainServer,config.data.roleId)
    if (!role) return openticket.log("Unable to remove ticket creator from non-existing assign role!","error",[
        {key:"roleid",value:config.data.roleId},
        {key:"channel",value:"#"+channel.name},
        {key:"channelid",value:channel.id,hidden:true},
        {key:"user",value:creator.displayName},
        {key:"userid",value:creator.id,hidden:true},
    ])

    const member = await openticket.client.fetchGuildMember(mainServer,creator.id)
    if (!member) return

    await member.roles.remove(role)
    openticket.log(creator.displayName+" has been removed from the assign role!","plugin",[
        {key:"roleid",value:config.data.roleId},
        {key:"channel",value:"#"+channel.name},
        {key:"channelid",value:channel.id,hidden:true},
        {key:"user",value:creator.displayName},
        {key:"userid",value:creator.id,hidden:true},
    ])
})