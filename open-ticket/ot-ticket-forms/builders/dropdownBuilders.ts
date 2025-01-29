import {api, openticket, utilities} from "#opendiscord"
import * as discord from "discord.js"

// DROPDOWNS
openticket.events.get("onDropdownBuilderLoad").listen((dropdowns) => {
    dropdowns.add(new api.ODDropdown("ot-ticket-forms:question-dropdown"));
    dropdowns.get("ot-ticket-forms:question-dropdown").workers.add(
        new api.ODWorker("ot-ticket-forms:question-dropdown", 0, (instance, params, source, cancel) => {
            const { formId, sessionId, choices, minValues, maxValues, placeholder } = params;

            const parsedChoices = choices.map((choice) => {
                return {
                    label:choice.name,
                    value:choice.name,
                    emoji:choice.emoji ? choice.emoji : undefined,
                    description:choice.description ? choice.description : undefined,
                }
            })
            instance.setCustomId(`ot-ticket-forms:qd_${formId}_${sessionId}`);
            instance.setType("string");
            instance.setMaxValues(maxValues ? maxValues : 1);
            instance.setMinValues(minValues ? minValues : 1);
            instance.setPlaceholder(placeholder);
            instance.setOptions(parsedChoices);
        })
    );
});