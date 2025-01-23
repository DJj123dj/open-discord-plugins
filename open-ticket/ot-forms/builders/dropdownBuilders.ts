import { api, openticket } from "#opendiscord";

// DROPDOWNS
openticket.events.get("onDropdownBuilderLoad").listen((dropdowns) => {
    dropdowns.add(new api.ODDropdown("ot-forms:question-dropdown"));
    dropdowns.get("ot-forms:question-dropdown").workers.add(
        new api.ODWorker("ot-forms:question-dropdown", 0, (instance, params, source, cancel) => {
            const { formId, sessionId, options, minValues, maxValues, placeholder } = params;

            const parsedOptions = options.map((option) => {
                return {
                    label:option.option,
                    value:option.option,
                    emoji:option.emoji ? option.emoji : undefined,
                    description:option.description ? option.description : undefined,
                }
            })
            instance.setCustomId(`ot-forms:qd_${formId}_${sessionId}`);
            instance.setType("string");
            instance.setMaxValues(maxValues ? maxValues : 1);
            instance.setMinValues(minValues ? minValues : 1);
            instance.setPlaceholder(placeholder);
            instance.setOptions(parsedOptions);
        })
    );
});