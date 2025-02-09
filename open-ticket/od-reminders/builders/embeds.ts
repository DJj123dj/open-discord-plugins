import { opendiscord, api, utilities } from "#opendiscord"
import * as discord from "discord.js"

// REGISTER EMBED BUILDERS
opendiscord.events.get("onEmbedBuilderLoad").listen((embeds,builders,actions) => {
    embeds.add(new api.ODEmbed("od-reminders:reminder-embed"))
    embeds.get("od-reminders:reminder-embed").workers.add(
        new api.ODWorker("od-reminders:reminder-embed",0,async (instance,params,source,cancel) => {
            const {reminder} = params
            instance.setTitle(reminder.get("od-reminders:embed-title").value)
            instance.setDescription(reminder.get("od-reminders:embed-description").value)
            instance.setColor(reminder.get("od-reminders:embed-color").value)
            instance.setFooter(reminder.get("od-reminders:embed-footer").value, reminder.get("od-reminders:footer-image").value)
            instance.setAuthor(reminder.get("od-reminders:embed-author").value, reminder.get("od-reminders:author-image").value)
            if (reminder.get("od-reminders:embed-timestamp").value) instance.setTimestamp(Date.now())
            instance.setImage(reminder.get("od-reminders:embed-image").value)
            instance.setThumbnail(reminder.get("od-reminders:embed-thumbnail").value)

        })
    )

    embeds.add(new api.ODEmbed("od-reminders:list-embed"))
    embeds.get("od-reminders:list-embed").workers.add(
        new api.ODWorker("od-reminders:list-embed",0,async (instance,params,source,cancel) => {
            const {reminders} = params
            const fields = reminders.map((reminder) => {
                const content = `> Channel: ${discord.channelMention(reminder.get("od-reminders:channel").value)}\n> Last Reminder: \`${reminder.get("od-reminders:start-time").value}\`\n> Interval: \`${reminder.get("od-reminders:interval").value.value} ${reminder.get("od-reminders:interval").value.unit}\``
                return {name: `${reminder.id.value.split(":")[1]}${reminder.get("od-reminders:paused").value ? " - ⏸️" : ""}`, value: content}
            })
            instance.setTitle("Reminders")
            instance.setColor(opendiscord.configs.get("opendiscord:general").data.mainColor)
            instance.setFields(fields)
        })
    )
})