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




