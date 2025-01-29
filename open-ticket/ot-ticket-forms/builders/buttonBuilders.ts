import {api, openticket, utilities} from "#opendiscord"
import * as discord from "discord.js"

// BUTTONS
openticket.events.get("onButtonBuilderLoad").listen((buttons) => {
    buttons.add(new api.ODButton("ot-ticket-forms:start-form-button"));
    buttons.get("ot-ticket-forms:start-form-button").workers.add(
        new api.ODWorker("ot-ticket-forms:start-form-button", 0, (instance, params, source, cancel) => {
            const { formId, enabled } = params;
            const label = enabled ? "Answer" : "Form Answered";
            instance.setMode("button");
            instance.setColor("green");
            instance.setEmoji("📝");
            instance.setLabel(label);
            instance.setDisabled(!enabled);
            instance.setCustomId(`ot-ticket-forms:sb_${formId}`);
        })
    );

    buttons.add(new api.ODButton("ot-ticket-forms:continue-button"));
    buttons.get("ot-ticket-forms:continue-button").workers.add(
        new api.ODWorker("ot-ticket-forms:continue-button", 0, (instance, params, source, cancel) => {
            const { formId, sessionId } = params;
            instance.setMode("button");
            instance.setColor("green");
            instance.setEmoji("➡️");
            instance.setLabel("Continue");
            instance.setCustomId(`ot-ticket-forms:cb_${formId}_${sessionId}`);   
        })
    );

    buttons.add(new api.ODButton("ot-ticket-forms:delete-answers-button"));
    buttons.get("ot-ticket-forms:delete-answers-button").workers.add(
        new api.ODWorker("ot-ticket-forms:delete-answers-button", 0, (instance, params, source, cancel) => {
            const { formId, sessionId } = params;
            instance.setMode("button");
            instance.setColor("red");
            instance.setEmoji("🗑️");
            instance.setLabel("Delete");
            instance.setCustomId(`ot-ticket-forms:db_${formId}_${sessionId}`);
        })
    );

    buttons.add(new api.ODButton("ot-ticket-forms:question-button"));
    buttons.get("ot-ticket-forms:question-button").workers.add(
        new api.ODWorker("ot-ticket-forms:question-button", 0, (instance, params, source, cancel) => {
            const { formId, sessionId, choice } = params;
            const emoji = choice.emoji ? choice.emoji : null;
            instance.setMode("button");
            instance.setColor(choice.color);
            instance.setEmoji(emoji);
            instance.setLabel(choice.name);
            instance.setCustomId(`ot-ticket-forms:qb_${formId}_${sessionId}_${choice.name}`);
        })
    );

    // PAGINATION BUTTONS
    buttons.add(new api.ODButton("ot-ticket-forms:next-page-button"));
    buttons.get("ot-ticket-forms:next-page-button").workers.add(
        new api.ODWorker("ot-ticket-forms:next-page-button", 0, (instance, params, source, cancel) => {
            const { currentPageNumber } = params;
            instance.setMode("button");
            instance.setColor("gray");
            instance.setEmoji("▶️");
            instance.setCustomId(`ot-ticket-forms:npb_${currentPageNumber}`);
        })
    );

    buttons.add(new api.ODButton("ot-ticket-forms:previous-page-button"));
    buttons.get("ot-ticket-forms:previous-page-button").workers.add(
        new api.ODWorker("ot-ticket-forms:previous-page-button", 0, (instance, params, source, cancel) => {
            const { currentPageNumber } = params;
            instance.setMode("button");
            instance.setColor("gray");
            instance.setEmoji("◀️");
            instance.setCustomId(`ot-ticket-forms:ppb_${currentPageNumber}`);
        })
    );

    buttons.add(new api.ODButton("ot-ticket-forms:page-number-button"));
    buttons.get("ot-ticket-forms:page-number-button").workers.add(
        new api.ODWorker("ot-ticket-forms:page-number-button", 0, (instance, params, source, cancel) => {
            const { currentPageNumber, totalPages } = params;
            instance.setMode("button");
            instance.setColor("gray");
            instance.setDisabled(true);
            instance.setLabel(`Page ${currentPageNumber}/${totalPages}`);
            instance.setCustomId(`ot-ticket-forms:pnb_${currentPageNumber}`);
        })
    );
});
