import {api, openticket, utilities} from "#opendiscord"
import * as discord from "discord.js"

// MESSAGE BUILDERS
openticket.events.get("onMessageBuilderLoad").listen((messages) => {
    /* START FORM MESSAGE
     * The message that shows the initial form message with the Answer button.
     */
    messages.add(new api.ODMessage("ot-ticket-forms:start-form-message"));
    messages.get("ot-ticket-forms:start-form-message").workers.add(
        new api.ODWorker("ot-ticket-forms:start-form-message", 0, async (instance, params, source, cancel) => {
            const { formId, formName, formDescription, formColor, acceptAnswers } = params;
            instance.setEmbeds(
                await openticket.builders.embeds.getSafe("ot-ticket-forms:start-form-embed").build(source, { formName, formDescription, formColor })
            );
            instance.addComponent(
                await openticket.builders.buttons.getSafe("ot-ticket-forms:start-form-button").build(source, { formId, enabled: acceptAnswers })
            );
        })
    );

    /* CONTINUE MESSAGE
     * The message that shows the continue button for a form.
     */
    messages.add(new api.ODMessage("ot-ticket-forms:continue-message"));
    messages.get("ot-ticket-forms:continue-message").workers.add(
        new api.ODWorker("ot-ticket-forms:continue-message", 0, async (instance, params, source, cancel) => {
            const { formId, sessionId, currentSection, totalSections, formColor } = params;
            instance.setEmbeds(
                await openticket.builders.embeds.getSafe("ot-ticket-forms:continue-embed").build(source, { currentSection, totalSections, formColor })
            );
            instance.setEphemeral(true);
            if(currentSection <= totalSections) {
                instance.addComponent(
                    await openticket.builders.buttons.getSafe("ot-ticket-forms:continue-button").build(source, { formId, sessionId })
                );
            }
        })
    );

    /* QUESTION MESSAGE
     * The message that shows a question of a form and offers you the answers.
     */
    messages.add(new api.ODMessage("ot-ticket-forms:question-message"));
    messages.get("ot-ticket-forms:question-message").workers.add(
        new api.ODWorker("ot-ticket-forms:question-message", 0, async (instance, params, source, cancel) => {
            const { formId, sessionId, question, currentSection, totalSections, formColor } = params;
            instance.setEmbeds(
                await openticket.builders.embeds.getSafe("ot-ticket-forms:question-embed").build(source, { question, currentSection, totalSections, formColor })
            );
            if ( question.type === "dropdown" ) {
                instance.addComponent(await openticket.builders.dropdowns.getSafe("ot-ticket-forms:question-dropdown").build(source, { formId, sessionId, choices: question.choices, minValues: question.minAnswerChoices, maxValues: question.maxAnswerChoices, placeholder: question.placeholder }));
            } else {
                for(const choice of question.choices) {
                    instance.addComponent(await openticket.builders.buttons.getSafe("ot-ticket-forms:question-button").build(source, { formId, sessionId: sessionId, choice }));
                };
            }
            instance.setEphemeral(true);
        }
    ));

    /* ANSWERS MESSAGE
     * The message that shows the answers of a form for a user.
     */
    messages.add(new api.ODMessage("ot-ticket-forms:answers-message"));
    messages.get("ot-ticket-forms:answers-message").workers.add(
        new api.ODWorker("ot-ticket-forms:answers-message", 0, async (instance, params, source, cancel) => {
            const { formId, sessionId, type, currentPageNumber, totalPages, currentPage } = params;
            instance.setEmbeds(currentPage);
           
            if(totalPages > 1) {
                // Adds pagination buttons
                if(currentPageNumber > 1) instance.addComponent(await openticket.builders.buttons.getSafe("ot-ticket-forms:previous-page-button").build(source, { currentPageNumber }));
                instance.addComponent(await openticket.builders.buttons.getSafe("ot-ticket-forms:page-number-button").build(source, { currentPageNumber, totalPages }));
                if(currentPageNumber < totalPages) instance.addComponent(await openticket.builders.buttons.getSafe("ot-ticket-forms:next-page-button").build(source, { currentPageNumber }));
            }
            
            if ( type === "initial" || type === "partial" ) {
                // Adds delete answers button
                instance.addComponent(await openticket.builders.buttons.getSafe("ot-ticket-forms:delete-answers-button").build(source, { formId, sessionId }));
            } else {
                instance.removeComponent("ot-ticket-forms:delete-answers-button");
            }
        })
    );

    /* SUCCESS COMMAND MESSAGE
     * The message that shows a success message after sending a form using the slash command.
     */
    messages.add(new api.ODMessage("ot-ticket-forms:success-message"))
    messages.get("ot-ticket-forms:success-message").workers.add(
        new api.ODWorker("ot-ticket-forms:success-message",0,async (instance,params,source,cancel) => {
            instance.setContent("✅ The form has been sent successfully!")
            instance.setEphemeral(true)
        })
    )
});
