import { opendiscord, api, utilities } from "#opendiscord"

// REGISTER MESSAGE BUILDERS
opendiscord.events.get("onMessageBuilderLoad").listen((messages,builders,actions) => {
    messages.add(new api.ODMessage("od-reminders:reminder-message"))
    messages.get("od-reminders:reminder-message").workers.add(
        new api.ODWorker("od-reminders:reminder-message",0,async (instance,params,source,cancel) => {
            const {reminder} = params
            const ping = reminder.get("od-reminders:ping").value
            const text = reminder.get("od-reminders:text").value

            instance.setContent(`${ping ? `${ping}\n` : ""}${text ? text : ""}`)
            if(reminder.get("od-reminders:embed-title").value || reminder.get("od-reminders:embed-description").value){
                instance.addEmbed(await opendiscord.builders.embeds.getSafe("od-reminders:reminder-embed").build(source,{reminder}))
            }
        })
    )

    messages.add(new api.ODMessage("od-reminders:list-message"))
    messages.get("od-reminders:list-message").workers.add(
        new api.ODWorker("od-reminders:list-message",0,async (instance,params,source,cancel) => {
            const {reminders} = params
            instance.addEmbed(await opendiscord.builders.embeds.getSafe("od-reminders:list-embed").build(source,{reminders}))
            instance.setEphemeral(true)
        })
    )

    messages.add(new api.ODMessage("od-reminders:success-message"))
    messages.get("od-reminders:success-message").workers.add(
        new api.ODWorker("od-reminders:success-message",0,async (instance,params,source,cancel) => {
            const { scope } = params
            instance.setContent(`✅ The reminder has been ${scope} successfully!`)
            instance.setEphemeral(true)
        })
    )
})

opendiscord.events.get("afterMessageBuildersLoaded").listen((messages) => {
    //ticket rename message
    messages.get("opendiscord:error").workers.add(new api.ODWorker("od-reminders:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(true)
    }))
    messages.get("opendiscord:error-no-permissions").workers.add(new api.ODWorker("od-reminders:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(true)
    }))
    messages.get("opendiscord:error-not-in-guild").workers.add(new api.ODWorker("od-reminders:edit-message",1,(instance,params,source,cancel) => {
        instance.setEphemeral(true)
    }))
})