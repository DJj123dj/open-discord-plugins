# OT Ticket Forms
This plugin allows you to create advanced forms with 4 types of questions. You can add unlimited questions to a form. The available types are:
- short text
- paragraph text
- dropdown
- buttons

> This README.md explains how to configure these forms using the provided JSON structure. 
> The configuration allows for highly customizable forms, including various question types like text, dropdowns and buttons.

### Structure of the Configuration File
Each form in the configuration file is defined as a JSON object with the following fields:

#### Form-Level Properties
- **`id`**: A unique identifier for the form. 
  - Example: `"example-form"`.

- **`name`**: The name of the form.
  - Example: `"Example Form"`.

- **`description`**: A brief description of the form (optional).
  - Example: `"This is an example form (or leave it empty)"`.

- **`color`**: A hexadecimal color code representing the form's visual theme.
  - Example: `"#f8ba00"`.

- **`responseChannel`**: The ID of the channel where responses will be sent.
  - Example: `"1331729987518201916"`.

- **`autoSendOptionIds`**: An array of Open Ticket option IDs where the form will be auto-sent when a user creates a ticket of this type.
  - Example: `["example-ticket-1", "example-ticket-2"]`.

#### Questions Section
The `questions` array defines the form's questions. Each question object includes the following properties:

> #### Common Question Properties
> 1. **`number`**: The question's unique number in the form.
> 2. **`question`**: The text of the question.
> 3. **`type`**: Specifies the question type. Supported values are:
>    - `"short"`: Short answer (single line) by a discord modal.
>    - `"paragraph"`: Paragraph answer (multiple lines) by a discord modal.
>    - `"dropdown"`: Dropdown menu with multiple options. It lets you select single or multiple answers.
>    - `"button"`: Button options.

> #### Type Text Properties
> For questions of type `short` or `long`:
> - **`optional`**: A boolean indicating if the question is optional (`true`) or required (`false`).
> - **`placeholder`**: A text placeholder for the response input (optional).

> #### Dropdown-Specific Properties
> For questions of type `dropdown`:
> - **`minAnswerChoices`**: The minimum number of choices a user must select.
> - **`maxAnswerChoices`**: The maximum number of choices a user can select.
> - **`placeholder`**: A text placeholder for the response input (optional).
> - **`choices`**: An array of dropdown choices. Each choice includes:
>   - **`name`**: The name of the choice.
>   - **`emoji`**: An emoji to display with the choice (optional).
>   - **`description`**: A description of the choice (optional).

> #### Button-Specific Properties
> For questions of type `button`:
> - **`choices`**: An array of button choices. Each button includes:
>   - **`name`**: The name of the button.
>   - **`emoji`**: An emoji to display with the button (optional).
>   - **`color`**: The button's color. Supported values: `"gray"`, `"red"`, `"green"`, `"blue"`.

### Example Form
```json
{
    "id": "example-form",
    "name": "Example Form",
    "description": "This is an example form (or leave it empty)",
    "color": "#99DD99",
    "responsesChannel": "channel id where the responses will be sent",
    "OTTicketAutoSend": ["example-ticket", "ticket id"],
    "questions": [
        {
            "number": 1,
            "question": "That's an example of short answer question? You can add as many questions as you want.",
            "type": "short",
            "optional": false,
            "placeholder": "Single line response, no paragraphs allowed. (or leave it empty)"
        },
        {
            "number": 2,
            "question": "That's an example of paragraph answer question?",
            "type": "long",
            "optional": false,
            "placeholder": "Multiple lines response, paragraphs allowed. (or leave it empty)"
        },
        {
            "number": 4,
            "question": "That's an example of multiple options dropdown question?",
            "type": "dropdown",
            "placeholder": "You can select only one option from the dropdown",
            "minAnswerOptions": 1,
            "maxAnswerOptions": 1,
            "options": [
                {
                    "option": "This is the first option.",
                    "emoji": "emoji (or leave it empty)",
                    "description": "description (or leave it empty)"
                },
                {
                    "option": "And this is the second option. You can add up to 25 options...",
                    "emoji": "emoji (or leave it empty)",
                    "description": "description (or leave it empty)"
                }
            ]
        }
    ]
}
```

### Notes
1. Each form must have a unique `id`.
2. The maximum number of dropdown or button options is 25.
3. Use meaningful and concise placeholders to guide users.
4. Keep required questions clear to ensure proper response handling.
5. A form does not have a question limit. But try to make it as shorter as you can so the user can answer in a short time.
6. You can add as many forms as you want.
7. The forms will be sent automatically when a user creates a ticket from which the option id is on the `autoSendOptionIds` field.
8. You can also send a form using the slash command `/form send <form> <channel>`.

By following this structure, you can create robust and flexible forms with the OT plugin.