import { opendiscord, api, utilities } from "#opendiscord"
import { ODReminderManager, ODReminder } from "./reminder"

import "./builders/messages";
import "./builders/embeds";
import "./builders/commands";

opendiscord.events.get("onPluginClassLoad").listen((classes) => {
    classes.add(new ODReminderManager(opendiscord.debug))
})

//Load database savers
opendiscord.events.get("onCodeLoad").listen(async (code) => {
    opendiscord.code.add(new api.ODCode("od-reminders",6,() => {
        const mainVersion = opendiscord.versions.get("opendiscord:version")
        const globalDatabase = opendiscord.databases.get("opendiscord:global")
        const reminderManager = opendiscord.plugins.classes.get("od-reminders:manager")

        reminderManager.onAdd(async (reminder) => {
            await globalDatabase.set("od-reminders:reminder",reminder.id.value,reminder.toJson(mainVersion))
        })
        reminderManager.onChange(async (reminder) => {
            await globalDatabase.set("od-reminders:reminder",reminder.id.value,reminder.toJson(mainVersion))
        })
        reminderManager.onRemove(async (reminder) => {
            await globalDatabase.delete("od-reminders:reminder",reminder.id.value)
        })
    }))
})

//REGISTER HELP MENU
opendiscord.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("od-reminders:reminder-create",0,{
        slashName:"reminder create",
        slashDescription:"Create a custom reminder in the server.",
    }))
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("od-reminders:reminder-delete",0,{
        slashName:"reminder delete",
        slashDescription:"Delete a reminder in the server.",
    }))
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("od-reminders:reminder-list",0,{
        slashName:"reminder list",
        slashDescription:"List all reminders in the server.",
    }))
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("od-reminders:reminder-pause",0,{
        slashName:"reminder pause",
        slashDescription:"Pause a reminder in the server.",
    }))
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("od-reminders:reminder-resume",0,{
        slashName:"reminder resume",
        slashDescription:"Resume a reminder in the server.",
    }))
})

//Load all reminders from the database
const loadAllReminders = async () => {
    const globalDatabase = opendiscord.databases.get("opendiscord:global")
    if (!globalDatabase) return

    const reminders = await globalDatabase.getCategory("od-reminders:reminder")
    if (!reminders) return
    for (const reminder of reminders){
        try {
            opendiscord.plugins.classes.get("od-reminders:manager").add(ODReminder.fromJson(reminder.value))
        } catch (err){
            process.emit("uncaughtException",err)
            process.emit("uncaughtException",new api.ODSystemError("Failed to load reminder from database! => id: "+reminder.key+"\n ===> "+err))
        }
    }
}

opendiscord.events.get("onReadyForUsage").listen(async () => {
    await loadAllReminders()

    //schedule reminders on reminderManager
    const reminderManager = opendiscord.plugins.classes.get("od-reminders:manager")
    reminderManager.getAll().forEach((reminder) => {
        reminder.schedule();
    })
})




