import { opendiscord, api, utilities } from "#opendiscord"
import * as discord from "discord.js"
import { ODReminder, ODReminderManager, ODReminderData, ODReminderJson } from "../reminder"

//LOAD COMMANDS
opendiscord.events.get("onSlashCommandLoad").listen((slash) => {
    const act = discord.ApplicationCommandType
    const acot = discord.ApplicationCommandOptionType
    slash.add(new api.ODSlashCommand("od-reminders:reminder", {
        name: "reminder",
        description: "Create, pause, resume, delete, or list reminders.",
        type: act.ChatInput,
        contexts: [discord.InteractionContextType.Guild],
        integrationTypes: [discord.ApplicationIntegrationType.GuildInstall],
        options: [
            {
                type: acot.Subcommand,
                name: "create",
                description: "Create a new reminder.",
                options: [
                    {
                        type: acot.String,
                        name: "id",
                        description: "The unique identifier for the reminder.",
                        required: true
                    },
                    {
                        type: acot.Channel,
                        name: "channel",
                        description: "The channel to send the reminder.",
                        required: true,
                        channelTypes: [discord.ChannelType.GuildText,discord.ChannelType.GuildAnnouncement]
                    },
                    {
                        type: acot.String,
                        name: "start-time",
                        description: "The time to start sending the reminder (DD/MM/YYYY HH:MM:SS). Use 'now' to start immediately.",
                        required: true
                    },
                    {
                        type: acot.Number,
                        name: "interval-value",
                        description: "The interval value. The reminder will be sent again every time this timer has been triggered.",
                        required: true
                    },
                    {
                        type: acot.String,
                        name: "interval-unit",
                        description: "The interval unit.",
                        required: true,
                        choices: [
                            { name: "Seconds", value: "seconds" },
                            { name: "Minutes", value: "minutes" },
                            { name: "Hours", value: "hours" },
                            { name: "Days", value: "days" },
                            { name: "Months", value: "months" },
                            { name: "Years", value: "years" }
                        ]
                    },
                    {
                        type:acot.String,
                        name:"color",
                        description:"The reminder embed color.",
                        required:false,
                        choices:[
                            {name:"White", value:"White"},
                            {name:"Aqua", value:"Aqua"},
                            {name:"Green", value:"Green"},
                            {name:"Blue", value:"Blue"},
                            {name:"Yellow", value:"Yellow"},
                            {name:"Purple", value:"Purple"},
                            {name:"Orange", value:"Orange"},
                            {name:"Red", value:"Red"},
                            {name:"Grey", value:"Grey"},
                            {name:"Navy", value:"Navy"},
                            {name:"Blurple", value:"Blurple"},
                            {name:"Black", value:"#000000"},
                            {name:"Bot Color", value:"%CONFIG_COLOR%"}
                        ]
                    },
                    {
                        type: acot.String,
                        name: "text",
                        description: "The reminder text (outside embed).",
                        required: false,
                        maxLength: 2048
                    },
                    {
                        type:acot.String,
                        name:"title",
                        description:"The reminder embed title.",
                        required:false,
                        maxLength:256
                    },
                    {
                        type:acot.String,
                        name:"description",
                        description:"The reminder embed description.",
                        required:false,
                        maxLength:4096
                    },
                    {
                        type:acot.String,
                        name:"footer",
                        description:"The reminder embed footer.",
                        required:false,
                        maxLength:2048
                    },
                    {
                        type:acot.String,
                        name:"author",
                        description:"The reminder embed author.",
                        required:false,
                        maxLength:256
                    },
                    {
                        type:acot.Boolean,
                        name:"timestamp",
                        description:"Add a timestamp on the reminder.",
                        required:false
                    },
                    {
                        type:acot.String,
                        name:"image",
                        description:"The reminder embed image.",
                        required:false
                    },
                    {
                        type:acot.String,
                        name:"thumbnail",
                        description:"The reminder embed thumbnail.",
                        required:false
                    },
                    {
                        type:acot.String,
                        name:"author-image",
                        description:"The reminder embed author image.",
                        required:false
                    },
                    {
                        type:acot.String,
                        name:"footer-image",
                        description:"The reminder embed footer image.",
                        required:false
                    },
                    {
                        type:acot.Mentionable,
                        name:"ping",
                        description:"The user/role you want to ping when sending the reminder.",
                        required:false
                    }
                ]
            },
            {
                type: acot.Subcommand,
                name: "pause",
                description: "Pause a reminder.",
                options: [
                    {
                        type: acot.String,
                        name: "id",
                        description: "The unique identifier for the reminder.",
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                type: acot.Subcommand,
                name: "resume",
                description: "Resume a reminder.",
                options: [
                    {
                        type: acot.String,
                        name: "id",
                        description: "The unique identifier for the reminder.",
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                type: acot.Subcommand,
                name: "delete",
                description: "Delete a reminder.",
                options: [
                    {
                        type: acot.String,
                        name: "id",
                        description: "The unique identifier for the reminder.",
                        required: true,
                        autocomplete: true
                    }
                ]
            },
            {
                type: acot.Subcommand,
                name: "list",
                description: "List all reminders."
            }
        ]
    }))

    //handle autocomplete for reminder IDs
    opendiscord.client.client.on("interactionCreate", async (interaction) => {
        if (!interaction.isAutocomplete()) return
        if (interaction.commandName !== "reminder") return
    
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const reminderManager = opendiscord.plugins.classes.get("od-reminders:manager")
        const reminderIds = reminderManager.getAll().map((reminder) => reminder.id.value)

        const filtered = reminderIds.filter((id) => id.toLowerCase().includes(focusedValue))

        await interaction.respond(filtered.map((id) => ({ name: id.split(":")[1], value: id })))
    })
})

// REGISTER COMMAND RESPONDER
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const reminderManager = opendiscord.plugins.classes.get("od-reminders:manager")
    const generalConfig = opendiscord.configs.get("opendiscord:general")

    commands.add(new api.ODCommandResponder("od-reminders:create", generalConfig.data.prefix, "reminder"))
    commands.get("od-reminders:create").workers.add([
        new api.ODWorker("od-reminders:create",0,async (instance,params,source,cancel) => {
            const { guild, channel, user } = instance
            if (!guild) {
                await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-not-in-guild").build(source,{channel,user}))
                return cancel()
            }

            if (!opendiscord.permissions.hasPermissions("admin",await opendiscord.permissions.getPermissions(instance.user,instance.channel,instance.guild))){
                //no permissions
                await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin"]}))
                return cancel()
            }

            //command doesn't support text-commands!
            if (source == "text") return cancel()
            const scope = instance.options.getSubCommand() as "create"|"pause"|"resume"|"delete"|"list"

            if (scope === "create") { //create a new reminder
                //max 25 reminders
                if (reminderManager.getAll().length >= 25) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"You have reached the maximum number of reminders.",layout:"simple"}))
                    return cancel()
                }

                //if id already exists or is invalid don't create another reminder
                const id = instance.options.getString("id",true)
                if (reminderManager.get(`od-reminders:${id}`)) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"Reminder already exists.",layout:"simple"}))
                    return cancel()
                } else if (id.includes(" ")) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"ID cannot contain spaces.",layout:"simple"}))
                    return cancel()
                }

                const rawColor = instance.options.getString("color", false);
                const color = rawColor ? (rawColor.replace("%CONFIG_COLOR%", generalConfig.data.mainColor.toString()) as discord.ColorResolvable) : null;
                
                let text = instance.options.getString("text",false)
                if(text) text = text.replace(/\\n/g, '\n')

                const title = instance.options.getString("title",false)
                let description = instance.options.getString("description",false)
                if (description) description = description.replace(/\\n/g, '\n')
                
                if (!text && !title && !description) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"You must provide a text, title, or description.",layout:"simple"}))
                    return cancel()
                }

                const footer = instance.options.getString("footer",false)
                const author = instance.options.getString("author",false)
                const timestamp = instance.options.getBoolean("timestamp",false)
                const image = instance.options.getString("image",false)
                const thumbnail = instance.options.getString("thumbnail",false)
                const authorImage = instance.options.getString("author-image",false)
                const footerImage = instance.options.getString("footer-image",false)
                
                const ping = instance.options.getMentionable("ping",false)
                let mentionable: string|null = null;
                if(ping && ping instanceof discord.Role) mentionable = discord.roleMention(ping.id)
                else if (ping) mentionable = discord.userMention(ping.id)
                
                const ch = instance.options.getChannel("channel",true)
                const intervalValue = instance.options.getNumber("interval-value",true)
                const intervalUnit = instance.options.getString("interval-unit",true)
                const startTimeRaw = instance.options.getString("start-time",true)
                const startTime = (startTimeRaw.toLowerCase() === "now") ? "now" : startTimeRaw

                //create and store new reminder
                const reminder = new ODReminder(`od-reminders:${id}`, [
                    new ODReminderData("od-reminders:channel", ch.id),
                    new ODReminderData("od-reminders:text", text),
                    new ODReminderData("od-reminders:embed-color", color),
                    new ODReminderData("od-reminders:embed-title", title),
                    new ODReminderData("od-reminders:embed-description", description),
                    new ODReminderData("od-reminders:embed-footer", footer),
                    new ODReminderData("od-reminders:embed-author", author),
                    new ODReminderData("od-reminders:embed-timestamp", timestamp),
                    new ODReminderData("od-reminders:embed-image", image),
                    new ODReminderData("od-reminders:embed-thumbnail", thumbnail),
                    new ODReminderData("od-reminders:author-image", authorImage),
                    new ODReminderData("od-reminders:footer-image", footerImage),
                    new ODReminderData("od-reminders:ping", mentionable),
                    new ODReminderData("od-reminders:start-time", startTime),
                    new ODReminderData("od-reminders:interval", { value: intervalValue, unit: intervalUnit }),
                    new ODReminderData("od-reminders:paused", false)
                ])
                reminderManager.add(reminder)
                reminder.schedule()

            } else if (scope === "pause") { //pause a reminder
                const id = instance.options.getString("id",true)
                const reminder = reminderManager.get(id)
                
                if (!reminder) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"Reminder not found.",layout:"simple"}))
                    return cancel()
                }
                if(reminder.get("od-reminders:paused").value) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"This reminder is already paused.",layout:"simple"}))
                    return cancel()
                }

                reminder.get("od-reminders:paused").value = true
                const sReminder = ODReminderManager.scheduledReminders.get(reminder.id)
                if (sReminder && sReminder.timeout) {
                    clearTimeout(sReminder.timeout)
                    ODReminderManager.scheduledReminders.delete(reminder.id)
                }
            } else if (scope === "resume") { //resume a reminder
                const id = instance.options.getString("id",true)
                const reminder = reminderManager.get(id)
                if (!reminder) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"Reminder not found.",layout:"simple"}))
                    return cancel()
                }
                if(!reminder.get("od-reminders:paused").value) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"This reminder is not paused.",layout:"simple"}))
                    return cancel()
                }

                reminder.get("od-reminders:paused").value = false
                reminder.schedule()

            } else if (scope === "delete") { //delete a reminder
                const id = instance.options.getString("id",true)
                const reminder = reminderManager.remove(id)
                if (!reminder) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"Reminder not found.",layout:"simple"}))
                    return cancel()
                }
                const sReminder = ODReminderManager.scheduledReminders.get(reminder.id)
                if (sReminder && sReminder.timeout){
                    clearTimeout(sReminder.timeout)
                    ODReminderManager.scheduledReminders.delete(reminder.id)
                }
                
            } else if (scope === "list") { //list all reminders
                const reminders = reminderManager.getAll()
                if (reminders.length === 0) {
                    await instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,error:"No reminders found.",layout:"simple"}))
                    return cancel()
                }
                await instance.reply(await opendiscord.builders.messages.getSafe("od-reminders:list-message").build(source,{reminders:reminders}))
            } 
            
            if (scope !== "list") {
                const scp = scope === "create" ? "created" : scope === "pause" ? "paused" : scope === "resume" ? "resumed" : "deleted"
                await instance.reply(await opendiscord.builders.messages.getSafe("od-reminders:success-message").build(source,{ scope: scp }))
            }
        }),
        new api.ODWorker("od-reminders:logs",-1,(instance,params,source,cancel) => {
            const scope = instance.options.getSubCommand()
            opendiscord.log(instance.user.displayName+" used the 'reminder "+scope+"' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source}
            ])
        })
    ])
})