import {api, opendiscord, utilities} from "#opendiscord"
import * as discord from "discord.js"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

import { OTForms_Form } from "./classes/Form"
import { OTForms_AnswersManager } from "./classes/AnswersManager";

import "./config/configRegistration";
import "./builders/messageBuilders";
import "./builders/embedBuilders";
import "./builders/buttonBuilders";
import "./builders/modalBuilders";
import "./builders/dropdownBuilders";
import "./builders/commandBuilders";

const forms = new Map<string, OTForms_Form>();

opendiscord.events.get("afterCodeExecuted").listen(async () => {
    const formsConfig = opendiscord.configs.get("ot-ticket-forms:config").data;
    for(const formConfig of formsConfig) {
        formConfig.questions.sort((a, b) => a.position - b.position);
    }
    opendiscord.log("Plugin \"ot-forms\" restoring answers...", "plugin");
    await OTForms_AnswersManager.restore();
})

/* TICKET CREATED EVENT
 * When a ticket is created, check if the ticket ID is in the list of forms that should be automatically sent.
 * If it is, send the form to the channel.
 */
opendiscord.events.get("afterTicketCreated").listen(async (ticket, creator, channel) => {
    const formsConfig = opendiscord.configs.get("ot-ticket-forms:config").data;
    const ticketId = ticket.option.id.value;

    for(const formConfig of formsConfig) {
        if (formConfig.autoSendOptionIds.includes(ticketId)) {

            const startMessageTemplate = await opendiscord.builders.messages.getSafe("ot-ticket-forms:start-form-message").build("ticket", {
                formId: formConfig.id,
                formName: formConfig.name,
                formDescription: formConfig.description,
                formColor: formConfig.color,
                acceptAnswers: true
            });

            const startMessage = await channel.send(startMessageTemplate.message);
            const answersChannel = await channel.guild.channels.fetch(formConfig.responseChannel);
            if(!answersChannel || !answersChannel.isTextBased()) {
                opendiscord.log("Error: Invalid answers channel.", "plugin");
                return;
            }
            
            const questions = formConfig.questions.sort((a, b) => a.position - b.position);
            const form = new OTForms_Form(formConfig.id, startMessage, formConfig.name, formConfig.color, startMessage, questions, answersChannel);
            forms.set(formConfig.id, form);
        }
    };
});

//REGISTER COMMAND RESPONDER
opendiscord.events.get("onCommandResponderLoad").listen((commands) => {
    const generalConfig = opendiscord.configs.get("opendiscord:general")
    const formsConfig = opendiscord.configs.get("ot-ticket-forms:config").data;

    /* FORM COMMAND RESPONDER
     * The command manage forms. Currently limited to sending forms to a channel.
     */
    commands.add(new api.ODCommandResponder("ot-ticket-forms:form",generalConfig.data.prefix,"form"))
    commands.get("ot-ticket-forms:form").workers.add([
        new api.ODWorker("ot-ticket-forms:form",0,async (instance,params,source,cancel) => {
            const {guild,channel,user} = instance
            if (!guild){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-not-in-guild").build("button",{channel,user}))
                return cancel()
            }

            if (!opendiscord.permissions.hasPermissions("admin",await opendiscord.permissions.getPermissions(instance.user,instance.channel,instance.guild))){
                instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error-no-permissions").build(source,{guild:instance.guild,channel:instance.channel,user:instance.user,permissions:["admin"]}))
                return cancel()
            }

            //command doesn't support text-commands!
            if (source == "text") return cancel()
            const scope = instance.options.getSubCommand() as "send"

            if (scope == "send"){
                const formId = instance.options.getString("id",true)
                const formChannel = instance.options.getChannel("channel",true) as discord.GuildTextBasedChannel
                
                const formConfig = formsConfig.find((form) => form.id == formId)
                if (!formConfig){
                    instance.reply(await opendiscord.builders.messages.getSafe("opendiscord:error").build(source,{guild,channel,user,layout:"simple",error:"Invalid form id. Please try again!"}))
                    return cancel()
                }

                const startMessageTemplate = await opendiscord.builders.messages.getSafe("ot-ticket-forms:start-form-message").build("ticket", {
                    formId: formConfig.id,
                    formName: formConfig.name,
                    formDescription: formConfig.description,
                    formColor: formConfig.color,
                    acceptAnswers: true
                });

                const startMessage = await formChannel.send(startMessageTemplate.message);
                const answersChannel = await guild.channels.fetch(formConfig.responseChannel);
                if(!answersChannel || !answersChannel.isTextBased()) {
                    opendiscord.log("Error: Invalid answers channel.", "plugin");
                    return;
                }

                const questions = formConfig.questions.sort((a, b) => a.position - b.position);
                const form = new OTForms_Form(formConfig.id, startMessage, formConfig.name, formConfig.color, startMessage, questions, answersChannel);
                forms.set(formConfig.id, form);
            }

            await instance.reply(await opendiscord.builders.messages.getSafe("ot-ticket-forms:success-message").build(source,{}))
        }),
        new api.ODWorker("ot-ticket-forms:logs",-1,(instance,params,source,cancel) => {
            const scope = instance.options.getSubCommand() as "send"
            opendiscord.log(instance.user.displayName+" used the 'form "+scope+"' command!","plugin",[
                {key:"user",value:instance.user.username},
                {key:"userid",value:instance.user.id,hidden:true},
                {key:"channelid",value:instance.channel.id,hidden:true},
                {key:"method",value:source}
            ])
        })
    ])
})

//REGISTER HELP MENU
opendiscord.events.get("onHelpMenuComponentLoad").listen((menu) => {
    menu.get("opendiscord:extra").add(new api.ODHelpMenuCommandComponent("ot-ticket-forms:form",0,{
        slashName:"form send",
        slashDescription:"Send a form to a channel.",
    }))
})

// BUTTON RESPONDER
opendiscord.events.get("onButtonResponderLoad").listen((buttons, responders, actions) => {
    /* START FORM BUTTON RESPONDER
     * The button to start answering a form.
     */
    buttons.add(new api.ODButtonResponder("ot-ticket-forms:start-form-button", /^ot-ticket-forms:sb_/));
    opendiscord.responders.buttons.get("ot-ticket-forms:start-form-button").workers.add(new api.ODWorker("ot-ticket-forms:start-form-button", 0, async (instance, params, source, cancel) => {
        const formId = instance.interaction.customId.split("_")[1];
        const form = forms.get(formId);
        if (!form) return

        const session = form.createSession(instance.interaction.user, instance.message);
        await session.setInstance(instance);
        await session.start();
    }));

    /* CONTINUE BUTTON RESPONDER
     * The button between two form questions. To continue to the next section of the form.
     */
    buttons.add(new api.ODButtonResponder("ot-ticket-forms:continue-button", /^ot-ticket-forms:cb_/));
    opendiscord.responders.buttons.get("ot-ticket-forms:continue-button").workers.add(new api.ODWorker("ot-ticket-forms:continue-button", 0, async (instance, params, source, cancel) => {
        const customIdParts = instance.interaction.customId.split("_");
        const formId = customIdParts[1];
        const form = forms.get(formId);
        if (!form) return

        const sessionId = customIdParts[2];

        const session = form.getSession(sessionId);
        if (!session) return

        session.setInstance(instance);

        await session.continue("question");
    }));

    /* DELETE ANSWERS MESSAGE BUTTON RESPONDER
     * The button to delete a form session. Visible on the answers message until the form is completed.
     */
    buttons.add(new api.ODButtonResponder("ot-ticket-forms:delete-answers-button", /^ot-ticket-forms:db_/));
    opendiscord.responders.buttons.get("ot-ticket-forms:delete-answers-button").workers.add(new api.ODWorker("ot-ticket-forms:delete-answers-button", 0, async (instance, params, source, cancel) => {
        await instance.defer("update",true);
        OTForms_AnswersManager.removeInstance(instance.message.id);
        instance.message.delete();

        const customIdParts = instance.interaction.customId.split("_");
        const formId = customIdParts[1];
        const form = forms.get(formId);
        if (!form) return

        const sessionId = customIdParts[2];

        form.finalizeSession(sessionId, form.name, instance.user);
    }));

    /* QUESTION BUTTON RESPONDER
     * A type button question can have multiple question buttons. Every button represents a possible answer.
     */
    buttons.add(new api.ODButtonResponder("ot-ticket-forms:question-button", /^ot-ticket-forms:qb_/));
    opendiscord.responders.buttons.get("ot-ticket-forms:question-button").workers.add(new api.ODWorker("ot-ticket-forms:question-button", 0, async (instance, params, source, cancel) => {
        const customIdParts = instance.interaction.customId.split("_");
        const formId = customIdParts[1];
        const form = forms.get(formId);
        if (!form) return

        const sessionId = customIdParts[2];

        const session = form.getSession(sessionId);
        if (!session) return

        session.setInstance(instance);

        const answer = customIdParts[3];
        await session.handleButtonResponse(answer);
    }));

    // PAGINATION BUTTONS
    /* NEXT PAGE BUTTON RESPONDER
     * The button to go to the next page of the answers message.
     */
    buttons.add(new api.ODButtonResponder("ot-ticket-forms:next-page-button", /^ot-ticket-forms:npb_/));
    opendiscord.responders.buttons.get("ot-ticket-forms:next-page-button").workers.add(new api.ODWorker("ot-ticket-forms:next-page-button", 0, async (instance, params, source, cancel) => {
        instance.defer("update",true);
        const answersManager = OTForms_AnswersManager.getInstance(instance.message.id);
        if (!answersManager) return;

        const currentPageNumber = Number(instance.interaction.customId.split("_")[1]);

        answersManager.editMessage(currentPageNumber + 1);
    }));

    /* PREVIOUS PAGE BUTTON RESPONDER
     * The button to go to the previous page of the answers message.
     */
    buttons.add(new api.ODButtonResponder("ot-ticket-forms:previous-page-button", /^ot-ticket-forms:ppb_/));
    opendiscord.responders.buttons.get("ot-ticket-forms:previous-page-button").workers.add(new api.ODWorker("ot-ticket-forms:previous-page-button", 0, async (instance, params, source, cancel) => {
        instance.defer("update",true);
        const answersManager = OTForms_AnswersManager.getInstance(instance.message.id);
        if (!answersManager) return;

        const currentPageNumber = Number(instance.interaction.customId.split("_")[1]);

        answersManager.editMessage(currentPageNumber - 1);
    }));
});

// MODAL RESPONDER
opendiscord.events.get("onModalResponderLoad").listen((modals, responders, actions) => {
    /* QUESTIONS MODAL RESPONDER
     * This modal is used to answer questions of a form.
     */
    modals.add(new api.ODModalResponder("ot-ticket-forms:questions-modal", /^ot-ticket-forms:qm_/));
    opendiscord.responders.modals.get("ot-ticket-forms:questions-modal").workers.add(new api.ODWorker("ot-ticket-forms:questions-modal", 0, async (instance, params, source, cancel) => {
        const customIdParts = instance.interaction.customId.split("_");
        const formId = customIdParts[1];
        const form = forms.get(formId);
        if (!form) return

        const sessionId = customIdParts[2];
        const session = form.getSession(sessionId);
        if (!session) return

        const answeredQuestions: {number: number,required:boolean}[] = customIdParts[3].split('-').map(pair => {
            const [num, required] = pair.split('/');
            return {
                number: Number(num),
                required: required === '1'
            };
        });

        const response = instance.values;
        session.setInstance(instance, true);

        await session.handleModalResponse(response, answeredQuestions);
    }));
})

opendiscord.events.get("onDropdownResponderLoad").listen((dropdowns, responders, actions) => {
    /* QUESTION DROPDOWN RESPONDER
     * This dropdown is used to answer questions of a form. It can be used for multiple choice questions.
     */
    dropdowns.add(new api.ODDropdownResponder("ot-ticket-forms:question-dropdown", /^ot-ticket-forms:qd_/));
    opendiscord.responders.dropdowns.get("ot-ticket-forms:question-dropdown").workers.add(new api.ODWorker("ot-ticket-forms:question-dropdown", 0, async (instance, params, source, cancel) => {
        const customIdParts = instance.interaction.customId.split("_");
        const formId = customIdParts[1];
        const form = forms.get(formId);
        if (!form) return

        const sessionId = customIdParts[2];
        const session = form.getSession(sessionId);
        if (!session) return

        const response = instance.values;
        session.setInstance(instance);
        
        await session.handleDropdownResponse(response);
    }));
});