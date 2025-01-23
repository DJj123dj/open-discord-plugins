import { api, openticket } from "#opendiscord";
import * as discord from "discord.js";

//REGISTER SLASH COMMAND
const act = discord.ApplicationCommandType
const acot = discord.ApplicationCommandOptionType
openticket.events.get("onSlashCommandLoad").listen((slash) => {
    const config = openticket.configs.get("ot-forms:config")

    //create form choices
    const formChoices : {name:string, value:string}[] = []
    config.data.forEach((form) => {
        formChoices.push({name:form.name,value:form.id})
    })
    
    slash.add(new api.ODSlashCommand("ot-forms:form",{
        name:"form",
        description:"Send a form.",
        type:act.ChatInput,
        contexts:[discord.InteractionContextType.Guild],
        integrationTypes:[discord.ApplicationIntegrationType.GuildInstall],
        options:[
            {
                type:acot.Subcommand,
                name:"send",
                description:"Send a form to a channel.",
                options:[
                    {
                        type:acot.String,
                        name:"id",
                        description:"The form to send.",
                        required:true,
                        choices:formChoices
                    },
                    {
                        type:acot.Channel,
                        name:"channel",
                        description:"The channel to send the form.",
                        required:true,
                        channelTypes:[discord.ChannelType.GuildText,discord.ChannelType.GuildAnnouncement]
                    }
                ]
            }
        ]
    },(current) => {
        //check if this slash command needs to be updated
        if (!current.options) return true

        const sendSubcommand = current.options.find((opt) => opt.name == "send") as discord.ApplicationCommandSubCommandData|undefined
        if (!sendSubcommand || !sendSubcommand.options) return true

        const idOption = sendSubcommand.options.find((opt) => opt.name == "id" && opt.type == acot.String) as discord.ApplicationCommandStringOptionData|undefined
        if (!idOption || !idOption.choices || idOption.choices.length != formChoices.length) return true
        else if (!formChoices.every((embed) => {
            if (!idOption.choices) return false
            else if (!idOption.choices.find((choice) => choice.value == embed.value && choice.name == embed.name)) return false
            else return true
        })) return true
        else return false
    }))
})