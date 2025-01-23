import { api, openticket } from "#opendiscord";

// BUTTONS
openticket.events.get("onButtonBuilderLoad").listen((buttons) => {
    buttons.add(new api.ODButton("ot-forms:start-form-button"));
    buttons.get("ot-forms:start-form-button").workers.add(
        new api.ODWorker("ot-forms:start-form-button", 0, (instance, params, source, cancel) => {
            const { formId, enabled } = params;
            const label = enabled ? "Answer" : "Form Answered";
            instance.setMode("button");
            instance.setColor("green");
            instance.setEmoji("📝");
            instance.setLabel(label);
            instance.setDisabled(!enabled);
            instance.setCustomId(`ot-forms:sb_${formId}`);
        })
    );

    buttons.add(new api.ODButton("ot-forms:continue-button"));
    buttons.get("ot-forms:continue-button").workers.add(
        new api.ODWorker("ot-forms:continue-button", 0, (instance, params, source, cancel) => {
            const { formId, sessionId } = params;
            instance.setMode("button");
            instance.setColor("green");
            instance.setEmoji("➡️");
            instance.setLabel("Continue");
            instance.setCustomId(`ot-forms:cb_${formId}_${sessionId}`);   
        })
    );

    buttons.add(new api.ODButton("ot-forms:delete-answers-button"));
    buttons.get("ot-forms:delete-answers-button").workers.add(
        new api.ODWorker("ot-forms:delete-answers-button", 0, (instance, params, source, cancel) => {
            const { formId, sessionId } = params;
            instance.setMode("button");
            instance.setColor("red");
            instance.setEmoji("🗑️");
            instance.setLabel("Eliminar");
            instance.setCustomId(`ot-forms:db_${formId}_${sessionId}`);
        })
    );

    buttons.add(new api.ODButton("ot-forms:question-button"));
    buttons.get("ot-forms:question-button").workers.add(
        new api.ODWorker("ot-forms:question-button", 0, (instance, params, source, cancel) => {
            const { formId, sessionId, option } = params;
            const emoji = option.emoji ? option.emoji : null;
            instance.setMode("button");
            instance.setColor(option.color);
            instance.setEmoji(emoji);
            instance.setLabel(option.option);
            instance.setCustomId(`ot-forms:qb_${formId}_${sessionId}_${option.option}`);
        })
    );

    // PAGINATION BUTTONS
    buttons.add(new api.ODButton("ot-forms:next-page-button"));
    buttons.get("ot-forms:next-page-button").workers.add(
        new api.ODWorker("ot-forms:next-page-button", 0, (instance, params, source, cancel) => {
            const { currentPageNumber } = params;
            instance.setMode("button");
            instance.setColor("gray");
            instance.setEmoji("▶️");
            instance.setCustomId(`ot-forms:npb_${currentPageNumber}`);
        })
    );

    buttons.add(new api.ODButton("ot-forms:previous-page-button"));
    buttons.get("ot-forms:previous-page-button").workers.add(
        new api.ODWorker("ot-forms:previous-page-button", 0, (instance, params, source, cancel) => {
            const { currentPageNumber } = params;
            instance.setMode("button");
            instance.setColor("gray");
            instance.setEmoji("◀️");
            instance.setCustomId(`ot-forms:ppb_${currentPageNumber}`);
        })
    );

    buttons.add(new api.ODButton("ot-forms:page-number-button"));
    buttons.get("ot-forms:page-number-button").workers.add(
        new api.ODWorker("ot-forms:page-number-button", 0, (instance, params, source, cancel) => {
            const { currentPageNumber, totalPages } = params;
            instance.setMode("button");
            instance.setColor("gray");
            instance.setDisabled(true);
            instance.setLabel(`Page ${currentPageNumber}/${totalPages}`);
            instance.setCustomId(`ot-forms:pnb_${currentPageNumber}`);
        })
    );
});
